import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { createBooking as createBookingRecord, deleteBooking as deleteBookingRecord, getBookings, updateBooking as updateBookingRecord } from './services/bookings'
import { getResources } from './services/resources'
import { getCustomers } from './services/customers'
import type { Booking, BookingStatus, CustomerRow, ResourceOptions } from './types/database'
import { bookingDurationMinutes, findBookingConflicts, formatDuration } from './lib/schedule'
import { deriveDashboardData } from './lib/dashboard'
import { isValidIsoDate, timeRangeError, validateBooking } from './lib/validation'
import { getEgilsstadirWeather } from './services/weather'
import type { CurrentWeather } from './services/weather'
import type { PrintSheetMode } from './PrintSheets'
import { ConfirmationProvider } from './components/ConfirmDialog'
import { useConfirmation } from './components/confirmationContext'
import { scheduleScrollPageToTop, scrollPageToTop, useBodyScrollLock } from './lib/useBodyScrollLock'
import { clearFormDraft, formDraftKey, useDraftDiscard, useFormDraft } from './lib/useFormDraft'
import { getUserIdentity } from './lib/userIdentity'
import './App.css'

const CalendarPage=lazy(()=>import('./CalendarPage').then(module=>({default:module.CalendarPage})))
const ExportDialog=lazy(()=>import('./ExportDialog').then(module=>({default:module.ExportDialog})))
const DailyPrintSheet=lazy(()=>import('./PrintSheets').then(module=>({default:module.DailyPrintSheet})))
const ToursPage=lazy(()=>import('./ResourcePages').then(module=>({default:module.ToursPage})))
const ShipsPage=lazy(()=>import('./ResourcePages').then(module=>({default:module.ShipsPage})))
const VehiclesPage=lazy(()=>import('./ResourcePages').then(module=>({default:module.VehiclesPage})))
const StaffPage=lazy(()=>import('./ResourcePages').then(module=>({default:module.StaffPage})))
const CustomersPage=lazy(()=>import('./ResourcePages').then(module=>({default:module.CustomersPage})))
const CustomerDetailPage=lazy(()=>import('./ResourcePages').then(module=>({default:module.CustomerDetailPage})))

type IconName = 'grid'|'bookings'|'schedule'|'calendar'|'tours'|'ship'|'vehicle'|'drivers'|'customers'|'search'|'plus'|'arrow'|'clock'|'people'|'check'|'chevron'|'menu'|'close'
const nav = [
  {label:'Dashboard',icon:'grid' as IconName},{label:'Bookings',icon:'bookings' as IconName},{label:'Daily schedule',icon:'schedule' as IconName},{label:'Calendar',icon:'calendar' as IconName},{label:'Tours',icon:'tours' as IconName},{label:'Ships',icon:'ship' as IconName},{label:'Vehicles',icon:'vehicle' as IconName},{label:'Staff',icon:'drivers' as IconName},{label:'Customers',icon:'customers' as IconName},
]

function Icon({name,size=18}:{name:IconName;size?:number}){
  const paths:Record<IconName,React.ReactNode>={
    grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    bookings:<><path d="M7 3h10v4H7z"/><path d="M5 5H4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1"/><path d="M7 12h10M7 16h6"/></>,schedule:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></>,tours:<><path d="M3 19 8 5l4 8 3-5 6 11Z"/><path d="m7 9 2 2 2-3"/></>,ship:<><path d="m3 14 2 6h14l2-6-9-4Z"/><path d="M8 11V5h8v6M12 5V2M3 22c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1"/></>,vehicle:<><path d="m5 17-2-2 2-6h14l2 6-2 2Z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M6 9 8 5h8l2 4"/></>,drivers:<><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0M4 12H2m20 0h-2"/></>,customers:<><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 8M18 15a6 6 0 0 1 4 6"/></>,search:<><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,plus:<path d="M12 5v14M5 12h14"/>,arrow:<path d="m9 18 6-6-6-6"/>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5h4"/></>,people:<><circle cx="9" cy="9" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20a6 6 0 0 1 12 0M15 15a5 5 0 0 1 6 5"/></>,check:<path d="m5 12 4 4L19 6"/>,chevron:<path d="m9 18 6-6-6-6"/>,menu:<path d="M4 7h16M4 12h16M4 17h16"/>,close:<path d="m6 6 12 12M18 6 6 18"/>,
  }
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
function Status({status}:{status:BookingStatus}){return <span className={`status status-${status.toLowerCase()}`}><span/>{status}</span>}

type AuthState='loading'|'unauthenticated'|'admin'|'denied'|'error'
function App(){
  const [authState,setAuthState]=useState<AuthState>('loading'),[user,setUser]=useState<User|null>(null),[authError,setAuthError]=useState('')
  useEffect(()=>{
    let active=true,request=0
    const resolve=async(nextUser:User|null)=>{
      const current=++request
      if(!active)return
      setUser(nextUser)
      setAuthError('')
      if(!nextUser){setAuthState('unauthenticated');return}
      setAuthState('loading')
      const {data,error}=await supabase.from('admin_users').select('user_id').eq('user_id',nextUser.id).maybeSingle()
      if(!active||current!==request)return
      if(error){console.error(error);setAuthError('Unable to verify administrator access. Check your connection and try again.');setAuthState('error');return}
      setAuthState(data?'admin':'denied')
    }
    supabase.auth.getSession().then(({data,error})=>{if(error){setAuthError('Unable to restore your session. Please try again.');setAuthState('error');return}void resolve(data.session?.user||null)}).catch(()=>{if(active){setAuthError('Unable to restore your session. Please try again.');setAuthState('error')}})
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{void resolve(session?.user||null)})
    return()=>{active=false;subscription.unsubscribe()}
  },[])
  useLayoutEffect(()=>{
    if(authState==='admin')return
    scrollPageToTop()
    const frame=window.requestAnimationFrame(()=>scrollPageToTop())
    return()=>window.cancelAnimationFrame(frame)
  },[authState])
  if(authState==='loading')return <AuthLoading/>
  if(authState==='unauthenticated')return <LoginScreen/>
  if(authState==='denied')return <AccessDenied email={user?.email||''}/>
  if(authState==='error')return <AuthError message={authError}/>
  return <OperationsApp user={user!}/>
}

function LoginScreen(){
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[submitting,setSubmitting]=useState(false)
  const submit=async(event:React.FormEvent)=>{event.preventDefault();if(submitting)return;const submittedControl=document.activeElement instanceof HTMLElement?document.activeElement:null;setError('');setSubmitting(true);try{const {error:authError}=await supabase.auth.signInWithPassword({email,password});if(authError)setError('Unable to sign in. Check your email and password.');else{submittedControl?.blur();if(document.activeElement instanceof HTMLElement)document.activeElement.blur();scrollPageToTop();window.requestAnimationFrame(()=>scrollPageToTop())}}catch{setError('Unable to reach the authentication service. Check your connection and try again.')}finally{setSubmitting(false)}}
  return <main className="auth-page"><section className="login-card"><img src="/goeast-logo.png" alt="GoEast"/><h1>Welcome back</h1><p>Sign in to manage bookings and daily operations.</p><form onSubmit={submit}><label><span>Email</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label><label><span>Password</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>{error&&<div className="auth-error">{error}</div>}<button className="primary-button" disabled={submitting}>{submitting?'Signing in…':'Sign in'}</button></form><small>Authorized GoEast staff only</small></section></main>
}
function AuthLoading(){return <main className="auth-page"><div className="app-loader"><span/><strong>Loading GoEast operations…</strong></div></main>}
function AccessDenied({email}:{email:string}){const [error,setError]=useState(''),[signingOut,setSigningOut]=useState(false);const signOut=async()=>{setSigningOut(true);setError('');try{const {error:nextError}=await supabase.auth.signOut();if(nextError)setError('Unable to sign out. Please try again.')}catch{setError('Unable to sign out. Check your connection and try again.')}finally{setSigningOut(false)}};return <main className="auth-page"><section className="login-card denied-card"><span className="denied-icon">!</span><p className="eyebrow">ACCESS DENIED</p><h1>Admin access required</h1><p>{email} is authenticated but is not registered as a GoEast administrator.</p>{error&&<div className="auth-error">{error}</div>}<button className="secondary-button" onClick={()=>void signOut()} disabled={signingOut}>{signingOut?'Signing out…':'Sign out'}</button></section></main>}
function AuthError({message}:{message:string}){return <main className="auth-page"><section className="login-card denied-card"><span className="denied-icon">!</span><p className="eyebrow">CONNECTION ERROR</p><h1>Access check unavailable</h1><p>{message}</p><button className="secondary-button" onClick={()=>window.location.reload()}>Try again</button></section></main>}

function WeatherWidget(){
  const [weather,setWeather]=useState<CurrentWeather|null>(null),[unavailable,setUnavailable]=useState(false)
  useEffect(()=>{const controller=new AbortController();getEgilsstadirWeather(controller.signal).then(value=>setWeather(value)).catch(error=>{if((error as Error).name!=='AbortError')setUnavailable(true)});return()=>controller.abort()},[])
  return <a className="weather-widget" href="https://open-meteo.com/" target="_blank" rel="noreferrer" title="Weather data by Open-Meteo"><span className="weather-icon" aria-hidden="true">{weather?.icon||'—'}</span><span><strong>Egilsstaðir</strong><small>{weather?`${weather.temperature}°C · ${weather.label}`:unavailable?'Weather unavailable':'Loading weather…'}</small></span></a>
}
function OperationsApp({user}:{user:User}){
  const routerNavigate=useNavigate(),location=useLocation()
  const identity=getUserIdentity(user)
  const sidebarRef=useRef<HTMLElement>(null),menuButtonRef=useRef<HTMLButtonElement>(null),mainRef=useRef<HTMLElement>(null)
  const [menuOpen,setMenuOpen]=useState(false),[bookingRecords,setBookingRecords]=useState<Booking[]>([]),[resources,setResources]=useState<ResourceOptions|null>(null),[customers,setCustomers]=useState<CustomerRow[]>([]),[loading,setLoading]=useState(true),[dataError,setDataError]=useState(''),[signOutError,setSignOutError]=useState(''),[signingOut,setSigningOut]=useState(false)
  const refreshData=async()=>{const [nextResources,nextCustomers]=await Promise.all([getResources(),getCustomers()]),nextBookings=await getBookings(nextResources,nextCustomers);setBookingRecords(nextBookings);setResources(nextResources);setCustomers(nextCustomers)}
  const load=async()=>{setLoading(true);setDataError('');try{await refreshData()}catch(error){setDataError(error instanceof Error?error.message:'Unable to load GoEast data.')}finally{setLoading(false)}}
  // Initial remote data necessarily resolves into local UI state after mount.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(()=>{void refreshData().catch(error=>setDataError(error instanceof Error?error.message:'Unable to load GoEast data.')).finally(()=>setLoading(false))},[])
  useBodyScrollLock(menuOpen)
  useLayoutEffect(()=>{
    const main=mainRef.current
    const mainOverflow=main?window.getComputedStyle(main).overflowY:''
    const scrollContainer=main&&/^(auto|scroll|overlay)$/.test(mainOverflow)?main:document.scrollingElement
    scrollPageToTop(main)
    return scheduleScrollPageToTop(scrollContainer instanceof HTMLElement?scrollContainer:main)
  },[location.pathname,location.search])
  useLayoutEffect(()=>{
    if(loading||location.pathname!=='/'||!resources)return
    if(document.activeElement instanceof HTMLElement)document.activeElement.blur()
    scrollPageToTop(mainRef.current)
    return scheduleScrollPageToTop(mainRef.current)
  },[loading,location.pathname,resources])
  useEffect(()=>{
    if(!menuOpen)return
    const menuButton=menuButtonRef.current
    const main=mainRef.current
    main?.setAttribute('inert','')
    main?.setAttribute('aria-hidden','true')
    const frame=window.requestAnimationFrame(()=>sidebarRef.current?.querySelector<HTMLElement>('.mobile-close')?.focus())
    const handleKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();setMenuOpen(false);return}
      if(event.key!=='Tab'||!sidebarRef.current)return
      const focusable=[...sidebarRef.current.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')]
      if(!focusable.length)return
      const first=focusable[0],last=focusable[focusable.length-1]
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    }
    document.addEventListener('keydown',handleKey)
    return()=>{window.cancelAnimationFrame(frame);document.removeEventListener('keydown',handleKey);main?.removeAttribute('inert');main?.removeAttribute('aria-hidden');menuButton?.focus({preventScroll:true})}
  },[menuOpen])
  const page=location.pathname.startsWith('/schedule')||location.pathname.startsWith('/daily-schedule')?'Daily schedule':location.pathname.startsWith('/calendar')?'Calendar':location.pathname.startsWith('/bookings/new')?'New booking':location.pathname.startsWith('/bookings')?'Bookings':location.pathname.startsWith('/tours')?'Tours':location.pathname.startsWith('/ships')?'Ships':location.pathname.startsWith('/vehicles')?'Vehicles':location.pathname.startsWith('/staff')?'Staff':location.pathname.startsWith('/customers')?'Customers':'Dashboard'
  const navigate=(label:string)=>{const paths:Record<string,string>={Dashboard:'/',Bookings:'/bookings','Daily schedule':'/schedule',Calendar:'/calendar',Tours:'/tours',Ships:'/ships',Vehicles:'/vehicles',Staff:'/staff',Customers:'/customers'};if(paths[label])routerNavigate(paths[label]);setMenuOpen(false)}
  const createBooking=async(booking:Booking)=>{await createBookingRecord(booking);await refreshData();routerNavigate('/bookings')}
  const updateBooking=async(booking:Booking)=>{await updateBookingRecord(booking);await refreshData()}
  const deleteBooking=async(booking:Booking)=>{await deleteBookingRecord(booking.uuid);clearFormDraft(formDraftKey('booking',booking.uuid));await refreshData();routerNavigate('/bookings',{state:{success:`Booking ${booking.id} deleted permanently.`}})}
  const signOut=async()=>{if(signingOut)return;setSigningOut(true);setSignOutError('');try{const {error}=await supabase.auth.signOut();if(error)setSignOutError('Unable to sign out. Please try again.')}catch{setSignOutError('Unable to sign out. Check your connection and try again.')}finally{setSigningOut(false)}}
  return <ConfirmationProvider><div className="app-shell">
    {menuOpen&&<button className="scrim" aria-label="Close navigation" onClick={()=>setMenuOpen(false)}/>}<aside id="app-navigation" ref={sidebarRef} className={`sidebar ${menuOpen?'sidebar-open':''}`}>
      <div className="brand-row"><button className="brand" onClick={()=>navigate('Dashboard')} aria-label="GoEast dashboard"><img className="brand-logo" src="/goeast-logo.png" alt="GoEast" /></button><button className="mobile-close" onClick={()=>setMenuOpen(false)} aria-label="Close menu"><Icon name="close"/></button></div>
      <nav aria-label="Main navigation"><p className="nav-label">WORKSPACE</p>{nav.slice(0,4).map(i=><NavItem key={i.label} item={i} page={page} onClick={navigate}/>)}<p className="nav-label nav-label-spaced">RESOURCES</p>{nav.slice(4).map(i=><NavItem key={i.label} item={i} page={page} onClick={navigate}/>)}</nav>
      <div className="sidebar-footer">{signOutError&&<div className="sidebar-error" role="alert">{signOutError}</div>}<button className="sidebar-signout" onClick={()=>void signOut()} disabled={signingOut}>{signingOut?'Signing out…':'Sign out'}</button></div>
    </aside>
    <main ref={mainRef} className="main"><header className="topbar"><button ref={menuButtonRef} className="menu-button" onClick={()=>setMenuOpen(true)} aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="app-navigation"><Icon name="menu" size={21}/></button><div className="global-search"><Icon name="search" size={17}/><input aria-label="Search everything" placeholder="Search bookings, customers..."/><kbd>⌘ K</kbd></div><div className="topbar-actions"><span className="live-indicator"><i/>Operations live</span><WeatherWidget/><div className="topbar-user" title={identity.email}><span className="top-avatar">{identity.initials}</span><span><strong>{identity.displayName}</strong><small>{identity.email}</small></span></div></div></header>
      {dataError?<DataError message={dataError} onRetry={()=>void load()}/>:loading?<PageLoading/>:resources?<Suspense fallback={<PageLoading/>}><Routes><Route path="/" element={<Dashboard data={bookingRecords} resources={resources} userName={identity.firstName} onViewBookings={()=>routerNavigate('/bookings')} onViewSchedule={()=>routerNavigate('/schedule')} onManageFleet={()=>routerNavigate('/vehicles')} onNewBooking={()=>routerNavigate('/bookings/new')} onOpenBooking={booking=>routerNavigate(`/bookings/${encodeURIComponent(booking.id)}`)}/>}/><Route path="/bookings" element={<BookingsPage data={bookingRecords} onNewBooking={()=>routerNavigate('/bookings/new')} onOpenBooking={booking=>routerNavigate(`/bookings/${encodeURIComponent(booking.id)}`)}/>}/><Route path="/bookings/new" element={<NewBookingPage onSave={createBooking} onCancel={()=>routerNavigate('/bookings')} existingCount={bookingRecords.length} resources={resources}/>}/><Route path="/bookings/:bookingId" element={<BookingDetailPage data={bookingRecords} resources={resources} onUpdate={updateBooking} onDelete={deleteBooking}/>}/><Route path="/schedule" element={<DailySchedulePage data={bookingRecords} onOpenBooking={booking=>routerNavigate(`/bookings/${encodeURIComponent(booking.id)}`)}/>}/><Route path="/daily-schedule" element={<DailySchedulePage data={bookingRecords} onOpenBooking={booking=>routerNavigate(`/bookings/${encodeURIComponent(booking.id)}`)}/>}/><Route path="/calendar" element={<CalendarPage data={bookingRecords}/>}/><Route path="/tours" element={<ToursPage items={resources.tours} onRefresh={refreshData}/>}/><Route path="/ships" element={<ShipsPage ships={resources.ships} resources={resources} onRefresh={refreshData}/>}/><Route path="/vehicles" element={<VehiclesPage items={resources.vehicles} onRefresh={refreshData}/>}/><Route path="/staff" element={<StaffPage items={resources.staff} onRefresh={refreshData}/>}/><Route path="/customers" element={<CustomersPage items={customers} onRefresh={refreshData}/>}/><Route path="/customers/:customerId" element={<CustomerDetailPage customers={customers} bookings={bookingRecords}/>}/><Route path="*" element={<NotFoundPage/>}/></Routes></Suspense>:<PageLoading/>}</main>
  </div></ConfirmationProvider>
}
function PageLoading(){return <div className="page-state"><div className="app-loader"><span/><strong>Loading bookings…</strong></div></div>}
function DataError({message,onRetry}:{message:string;onRetry:()=>void}){return <div className="page-state"><div className="data-error"><strong>We couldn’t load operational data.</strong><p>{message}</p><button className="secondary-button" onClick={onRetry}>Try again</button></div></div>}
function NotFoundPage(){const navigate=useNavigate();return <div className="page record-not-found"><p className="eyebrow">GOEAST OPERATIONS</p><h1>Page not found</h1><p>The page may have moved or the address is incorrect.</p><button className="secondary-button" onClick={()=>navigate('/')}>Back to dashboard</button></div>}
function NavItem({item,page,onClick}:{item:typeof nav[number];page:string;onClick:(l:string)=>void}){const active=page===item.label||(page==='New booking'&&item.label==='Bookings');return <button className={`nav-item ${active?'active':''}`} onClick={()=>onClick(item.label)}><Icon name={item.icon}/><span>{item.label}</span></button>}

function Dashboard({data,resources,userName,onViewBookings,onViewSchedule,onManageFleet,onNewBooking,onOpenBooking}:{data:Booking[];resources:ResourceOptions;userName:string;onViewBookings:()=>void;onViewSchedule:()=>void;onManageFleet:()=>void;onNewBooking:()=>void;onOpenBooking:(booking:Booking)=>void}){
  const [now,setNow]=useState(()=>new Date())
  useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),60_000);return()=>window.clearInterval(timer)},[])
  const dashboard=useMemo(()=>deriveDashboardData(data,resources,now),[data,resources,now])
  const missingDrivers=dashboard.unassigned.filter(item=>!item.driverId).length,missingVehicles=dashboard.unassigned.filter(item=>!item.vehicleId).length,missingGuides=dashboard.unassigned.filter(item=>!item.guideId).length
  return <div className="page dashboard-page">
  <div className="page-heading"><div><p className="eyebrow">{dashboard.todayLabel}</p><h1>{dashboard.greeting}, {userName}.</h1><p>Here’s what’s happening across GoEast today.</p></div><button className="primary-button" onClick={onNewBooking}><Icon name="plus" size={17}/>New booking</button></div>
  <section className="stats-grid"><Stat icon="bookings" label="TODAY’S BOOKINGS" value={String(dashboard.today.length)} detail={dashboard.today.length?`${dashboard.today.filter(item=>item.status==='Inquiry').length} awaiting confirmation`:'No bookings today'} tone="gold"/><Stat icon="people" label="GUESTS TODAY" value={String(dashboard.today.reduce((sum,item)=>sum+item.guests,0))} detail={dashboard.today.length?`Across ${dashboard.today.length} tour groups`:'No guests scheduled'} tone="green"/><Stat icon="tours" label="TOURS DEPARTING" value={String(dashboard.today.length)} detail={dashboard.today[0]?`First departure ${dashboard.today[0].time}`:'No departures today'} tone="blue"/><Stat icon="drivers" label="UNASSIGNED BOOKINGS" value={String(dashboard.unassigned.length)} detail={dashboard.today.length?`${missingDrivers} driver · ${missingVehicles} vehicle · ${missingGuides} guide`:'No active bookings'} tone="purple"/></section>
  <div className="dashboard-grid"><section className="panel schedule-panel"><div className="panel-header"><div><p className="eyebrow">UPCOMING OPERATIONS</p><h2>Upcoming departures</h2></div><button className="text-button" onClick={onViewSchedule}>View schedule <Icon name="arrow" size={15}/></button></div><div className="departures">{dashboard.upcoming.map((booking,index)=><article className="departure" key={booking.uuid}><div className="tour-time"><strong>{booking.time}</strong><small>{booking.serviceDate===dashboard.todayIso?'Today':booking.date}</small></div><span className="timeline-dot" style={{'--dot':['#d8a83f','#8c9f7b','#7891ad'][index]} as React.CSSProperties}/><div className="tour-info"><strong>{booking.tour}</strong><small>{booking.customer} · {booking.guests} guests</small></div><div className="departure-operations"><small>{booking.vehicle}</small><strong>{booking.driver} · {booking.guide}</strong></div><button className="row-arrow" onClick={()=>onOpenBooking(booking)} aria-label={`Open booking ${booking.id}`}><Icon name="arrow" size={16}/></button></article>)}{!dashboard.upcoming.length&&<div className="dashboard-empty">No upcoming departures.</div>}</div><div className="schedule-note"><Icon name="clock" size={17}/><span>Schedule is synced with <strong>Supabase</strong></span></div></section>
    <section className="panel fleet-panel"><div className="panel-header"><div><p className="eyebrow">FLEET STATUS</p><h2>Vehicles</h2></div></div><div className="fleet-list">{dashboard.fleet.map(item=><Fleet key={item.vehicle.id} name={item.vehicle.name} meta={item.booking?`${item.booking.time} · ${item.booking.tour} · ${item.booking.driver}`:[item.vehicle.registration_number,item.vehicle.capacity?`${item.vehicle.capacity} seats`:null].filter(Boolean).join(' · ')||'No assignments today'} status={item.status} tone={item.tone}/>)}{!dashboard.fleet.length&&<div className="dashboard-empty">{resources.vehicles.length?'No active vehicles.':'No vehicles added yet.'}</div>}</div><button className="full-text-button" onClick={onManageFleet}>Manage fleet <Icon name="arrow" size={15}/></button></section></div>
  <section className="panel recent-panel"><div className="panel-header"><div><p className="eyebrow">LATEST ACTIVITY</p><h2>Recent bookings</h2></div><button className="text-button" onClick={onViewBookings}>View all bookings <Icon name="arrow" size={15}/></button></div><BookingTable data={dashboard.recent} compact onSelect={onOpenBooking} emptyMessage="No recent bookings yet."/></section>
</div>}

const scheduleDate=(iso:string)=>{if(!iso)return '';const [year,month,day]=iso.split('-');return `${day} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(month)-1]} ${year}`}

function DailySchedulePage({data,onOpenBooking}:{data:Booking[];onOpenBooking:(booking:Booking)=>void}){
  const [searchParams,setSearchParams]=useSearchParams(),requestedDate=searchParams.get('date')||'',selectedDate=isValidIsoDate(requestedDate)?requestedDate:new Date().toISOString().slice(0,10)
  const [ship,setShip]=useState('All ships'),[tour,setTour]=useState('All tours'),[driver,setDriver]=useState('All drivers'),[vehicle,setVehicle]=useState('All vehicles'),[status,setStatus]=useState('All statuses')
  const [printJob,setPrintJob]=useState<{mode:PrintSheetMode;generatedAt:Date}|null>(null)
  const dayBookings=useMemo(()=>data.filter(item=>item.serviceDate===selectedDate).sort((a,b)=>a.time.localeCompare(b.time)),[data,selectedDate])
  const conflicts=useMemo(()=>findBookingConflicts(dayBookings),[dayBookings])
  const filtered=dayBookings.filter(item=>(ship==='All ships'||item.ship===ship)&&(tour==='All tours'||item.tour===tour)&&(driver==='All drivers'||item.driver===driver)&&(vehicle==='All vehicles'||item.vehicle===vehicle)&&(status==='All statuses'||item.status===status))
  const active=dayBookings.filter(item=>item.status!=='Cancelled')
  const unassigned=active.filter(item=>[item.vehicle,item.driver,item.guide].some(value=>!value||value==='Unassigned')).length
  const unique=(key:'ship'|'tour'|'driver'|'vehicle')=>[...new Set(data.map(item=>item[key]))].sort()
  const changeDate=(date:string)=>setSearchParams({date})
  const moveDay=(days:number)=>{const value=new Date(`${selectedDate}T12:00:00`);value.setDate(value.getDate()+days);changeDate(value.toISOString().slice(0,10))}
  useEffect(()=>{if(!printJob)return;const finish=()=>setPrintJob(null),timer=window.setTimeout(()=>window.print(),0);window.addEventListener('afterprint',finish,{once:true});return()=>{window.clearTimeout(timer);window.removeEventListener('afterprint',finish)}},[printJob])
  const print=(mode:PrintSheetMode)=>setPrintJob({mode,generatedAt:new Date()})
  return <div className="page schedule-page">
    <div className="schedule-heading"><div><p className="eyebrow">OPERATIONS</p><h1>Daily schedule</h1><p className="print-date">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p></div><div className="schedule-header-actions"><div className="date-nav"><button onClick={()=>moveDay(-1)} aria-label="Previous day">‹</button><button className="today-button" onClick={()=>changeDate(new Date().toISOString().slice(0,10))}>Today</button><button onClick={()=>moveDay(1)} aria-label="Next day">›</button><label><span className="sr-only">Select date</span><input type="date" value={selectedDate} onChange={e=>{if(e.target.value)changeDate(e.target.value)}}/></label></div><button className="secondary-button print-button" onClick={()=>print('drivers')}>Driver sheet</button><button className="secondary-button print-button" onClick={()=>print('operations')}>Print day sheet</button></div></div>
    <section className="schedule-stats"><ScheduleStat label="Departures" value={active.length} icon="schedule" tone="gold"/><ScheduleStat label="Guests" value={active.reduce((sum,item)=>sum+item.guests,0)} icon="people" tone="green"/><ScheduleStat label="Unassigned" value={unassigned} icon="drivers" tone="purple" alert={unassigned>0}/><ScheduleStat label="Conflicts" value={conflicts.size} icon="clock" tone="red" alert={conflicts.size>0}/></section>
    <section className="panel schedule-workspace">
      <div className="schedule-filters"><Filter label="Ship" value={ship} onChange={setShip} options={unique('ship')} all="All ships"/><Filter label="Tour" value={tour} onChange={setTour} options={unique('tour')} all="All tours"/><Filter label="Driver" value={driver} onChange={setDriver} options={unique('driver')} all="All drivers"/><Filter label="Vehicle" value={vehicle} onChange={setVehicle} options={unique('vehicle')} all="All vehicles"/><Filter label="Status" value={status} onChange={setStatus} options={['Inquiry','Confirmed','Completed','Cancelled']} all="All statuses"/></div>
      <div className="schedule-list"><div className="schedule-list-head"><span>TIME</span><span>TOUR / SHIP</span><span>BOOKING / CUSTOMER</span><span>GUESTS</span><span>OPERATIONS</span><span>PICKUP</span><span>STATUS</span></div>{filtered.map((booking,index)=><ScheduleRow key={booking.id} booking={booking} conflicts={conflicts.get(booking.id)||[]} first={index===0} last={index===filtered.length-1} onClick={()=>onOpenBooking(booking)}/>)}{!filtered.length&&<div className="schedule-empty"><Icon name="calendar" size={25}/><strong>No departures scheduled</strong><span>There are no bookings matching this date and filter set.</span></div>}</div>
    </section>
    {printJob&&<DailyPrintSheet mode={printJob.mode} date={selectedDate} bookings={dayBookings} generatedAt={printJob.generatedAt}/>}
  </div>
}

function ScheduleStat({label,value,icon,tone,alert=false}:{label:string;value:number;icon:IconName;tone:string;alert?:boolean}){return <article className={`schedule-stat ${alert?'has-alert':''}`}><span className={`schedule-stat-icon tone-${tone}`}><Icon name={icon} size={17}/></span><div><span>{label}</span><strong>{value}</strong></div></article>}
function Assignment({label,value}:{label:string;value:string}){const missing=!value||value==='Unassigned';return <span className={`assignment ${missing?'missing':''}`}><small>{label}</small><strong>{missing?`No ${label.toLowerCase()} assigned`:value}</strong></span>}
function ScheduleRow({booking,conflicts,first,last,onClick}:{booking:Booking;conflicts:string[];first:boolean;last:boolean;onClick:()=>void}){return <article className={`schedule-row ${booking.status==='Cancelled'?'is-cancelled':''}`} onClick={onClick} tabIndex={0} onKeyDown={e=>{if(e.currentTarget===e.target&&(e.key==='Enter'||e.key===' '))onClick()}}><div className="schedule-time"><span className={`schedule-node ${first?'first':''} ${last?'last':''}`}/><strong>{booking.time}</strong><small>{booking.endTime||`≈ ${formatDuration(bookingDurationMinutes(booking))}`}</small></div><div className="schedule-tour"><strong>{booking.tour}</strong><small>{booking.ship} · {booking.cruiseLine}</small>{conflicts.length>0&&<div className="conflict-badges">{conflicts.map(message=><span key={message}>! {message}</span>)}</div>}</div><div className="schedule-booking"><strong>{booking.id}</strong><small>{booking.customer}</small></div><div className="schedule-guests"><Icon name="people" size={15}/><strong>{booking.guests}</strong></div><div className="schedule-assignments"><Assignment label="Vehicle" value={booking.vehicle}/><Assignment label="Driver" value={booking.driver}/><Assignment label="Guide" value={booking.guide}/></div><div className="schedule-pickup"><strong>{booking.pickupLocation||booking.port||'Pickup not set'}</strong><small>{booking.ship}</small></div><div className="schedule-row-status"><Status status={booking.status}/><button className="row-arrow" aria-label={`Open booking ${booking.id}`}><Icon name="arrow" size={16}/></button></div></article>}

function Stat({icon,label,value,detail,tone}:{icon:IconName;label:string;value:string;detail:string;tone:string}){return <article className="stat-card"><div className={`stat-icon tone-${tone}`}><Icon name={icon} size={19}/></div><p className="eyebrow">{label}</p><strong className="stat-value">{value}</strong><p className="stat-detail">{detail}</p></article>}
function Fleet({name,meta,status,tone}:{name:string;meta:string;status:string;tone:string}){return <div className="fleet-row"><span className={`vehicle-icon tone-${tone}`}><Icon name="vehicle" size={18}/></span><div><strong>{name}</strong><small>{meta}</small></div><span className={`fleet-status ${tone}`}>{status}</span></div>}
function BookingsPage({data,onNewBooking,onOpenBooking}:{data:Booking[];onNewBooking:()=>void;onOpenBooking:(booking:Booking)=>void}){
  const location=useLocation(),routeNotice=(location.state as {success?:string}|null)?.success
  const [query,setQuery]=useState(''),[date,setDate]=useState('All dates'),[status,setStatus]=useState('All statuses'),[ship,setShip]=useState('All ships'),[tour,setTour]=useState('All tours'),[driver,setDriver]=useState('All drivers')
  const [showExport,setShowExport]=useState(false)
  const unique=(key:'ship'|'tour'|'driver')=>[...new Set(data.map(item=>item[key]))]
  const filtered=useMemo(()=>data.filter(b=>{
    const matchesSearch=`${b.id} ${b.customer} ${b.ship} ${b.tour} ${b.driver}`.toLowerCase().includes(query.toLowerCase())
    const matchesDate=date==='All dates'||b.date===date
    return matchesSearch&&matchesDate&&(status==='All statuses'||b.status===status)&&(ship==='All ships'||b.ship===ship)&&(tour==='All tours'||b.tour===tour)&&(driver==='All drivers'||b.driver===driver)
  }),[data,query,date,status,ship,tour,driver])
  const hasFilters=query||date!=='All dates'||status!=='All statuses'||ship!=='All ships'||tour!=='All tours'||driver!=='All drivers'
  const clearFilters=()=>{setQuery('');setDate('All dates');setStatus('All statuses');setShip('All ships');setTour('All tours');setDriver('All drivers')}
  return <div className="page bookings-page">
    <div className="page-heading"><div><p className="eyebrow">OPERATIONS</p><h1>Bookings</h1><p>Manage cruise calls, guest reservations, and tour assignments.</p></div><div className="page-heading-actions"><button className="secondary-button" onClick={()=>setShowExport(true)}>Export</button><button className="primary-button" onClick={onNewBooking}><Icon name="plus" size={17}/>New booking</button></div></div>
    {routeNotice&&<div className="record-feedback success" role="status"><Icon name="check" size={16}/>{routeNotice}</div>}
    <section className="booking-summary"><div><span>All bookings</span><strong>{data.length}</strong></div><div><span>Confirmed</span><strong>{data.filter(b=>b.status==='Confirmed').length}</strong></div><div><span>Open inquiries</span><strong className="gold-text">{data.filter(b=>b.status==='Inquiry').length}</strong></div><div><span>Completed</span><strong>{data.filter(b=>b.status==='Completed').length}</strong></div></section>
    <section className="panel bookings-panel">
      <div className="booking-toolbar booking-toolbar-primary"><label className="table-search"><Icon name="search" size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search booking, customer, ship, tour..." aria-label="Search bookings"/></label><div className="result-count"><strong>{filtered.length}</strong> results</div>{hasFilters&&<button className="clear-filters" onClick={clearFilters}>Clear filters</button>}</div>
      <div className="filter-row">
        <Filter label="Date" value={date} onChange={setDate} options={[...new Set(data.map(b=>b.date))]} all="All dates"/>
        <Filter label="Status" value={status} onChange={setStatus} options={['Inquiry','Confirmed','Completed','Cancelled']} all="All statuses"/>
        <Filter label="Ship" value={ship} onChange={setShip} options={unique('ship')} all="All ships"/>
        <Filter label="Tour" value={tour} onChange={setTour} options={unique('tour')} all="All tours"/>
        <Filter label="Driver" value={driver} onChange={setDriver} options={unique('driver')} all="All drivers"/>
      </div>
      <BookingTable data={filtered} onSelect={onOpenBooking}/>
      <div className="table-footer"><span>Showing {filtered.length} of {data.length} bookings</span><div><button disabled>Previous</button><button disabled={filtered.length<9}>Next</button></div></div>
    </section>
    {showExport&&<ExportDialog allBookings={data} filteredBookings={filtered} onClose={()=>setShowExport(false)}/>}
  </div>
}

type NewBookingForm = {
  id:string; status:BookingStatus; bookingDate:string; customerName:string; contactPerson:string;
  email:string; phone:string; ship:string; cruiseLine:string; port:string; tour:string;
  tourDate:string; startTime:string; endTime:string; guests:string; vehicle:string;
  driver:string; guide:string; pickupLocation:string; meetingInstructions:string;
  price:string; currency:string; paymentStatus:string; notes:string
}

function NewBookingPage({onSave,onCancel,existingCount,resources}:{onSave:(booking:Booking)=>Promise<void>;onCancel:()=>void;existingCount:number;resources:ResourceOptions}){
  const firstShip=resources.ships[0],firstLine=resources.cruiseLines.find(line=>line.id===firstShip?.cruise_line_id)
  const today=new Date().toISOString().slice(0,10),bookingPrefix=today.slice(2).replaceAll('-','')
  const initialForm:NewBookingForm={
    id:`GE-${bookingPrefix}-${String(existingCount+1).padStart(2,'0')}`,status:'Confirmed',bookingDate:today,customerName:'',contactPerson:'',email:'',phone:'',ship:firstShip?.id||'',cruiseLine:firstLine?.name||'',port:'',tour:'',tourDate:today,startTime:'',endTime:'',guests:'1',vehicle:'',driver:'',guide:'',pickupLocation:'',meetingInstructions:'',price:'0',currency:'ISK',paymentStatus:'unpaid',notes:''
  }
  const {value:form,setValue:setForm,dirty,clearDraft}=useFormDraft(formDraftKey('booking'),initialForm,'new-booking-v1')
  const discardDraft=useDraftDiscard(dirty,clearDraft,onCancel,'booking')
  const [errors,setErrors]=useState<Record<string,string>>({}),[saving,setSaving]=useState(false),[saveError,setSaveError]=useState('')
  const set=(key:keyof NewBookingForm)=>(value:string)=>{setForm(current=>({...current,[key]:value}));setErrors(current=>({...current,[key]:''}))}
  const validate=()=>{
    const next:Record<string,string>={}
    if(!form.id.trim())next.id='Booking number is required'
    if(!form.customerName.trim())next.customerName='Customer name is required'
    if(!isValidIsoDate(form.bookingDate))next.bookingDate='Enter a valid booking date'
    if(!form.tour)next.tour='Tour is required'
    if(!isValidIsoDate(form.tourDate))next.tourDate='Enter a valid tour date'
    const timeError=timeRangeError(form.startTime,form.endTime)
    if(timeError)next[form.endTime?'endTime':'startTime']=timeError
    const guests=Number(form.guests),price=Number(form.price)
    if(!Number.isInteger(guests)||guests<1)next.guests='At least one whole-number guest is required'
    if(!Number.isFinite(price)||price<0)next.price='Price must be zero or greater'
    setErrors(next)
    return Object.keys(next).length===0
  }
  const submit=async(asInquiry=false)=>{
    if(saving||!validate())return
    setSaving(true);setSaveError('')
    const displayName=form.customerName.trim()
    const initials=(form.contactPerson||displayName).split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()
    const date=scheduleDate(form.tourDate)
    const amount=Number(form.price).toLocaleString('en-US',{maximumFractionDigits:0})
    const ship=resources.ships.find(item=>item.id===form.ship),tour=resources.tours.find(item=>item.id===form.tour),vehicle=resources.vehicles.find(item=>item.id===form.vehicle),driver=resources.staff.find(item=>item.id===form.driver),guide=resources.staff.find(item=>item.id===form.guide)
    try{await onSave({uuid:'',id:form.id,customer:displayName,customerId:null,contactPerson:form.contactPerson,initials,email:form.email,phone:form.phone,country:'—',bookingDate:form.bookingDate,date,serviceDate:form.tourDate,time:form.startTime,endTime:form.endTime,ship:ship?.name||'Unassigned',shipId:ship?.id||null,cruiseLine:form.cruiseLine,port:form.port,tour:tour?.name||'',tourId:tour?.id||'',tourDurationMinutes:tour?.default_duration_minutes??null,guests:Number(form.guests),vehicle:vehicle?.name||'Unassigned',vehicleId:vehicle?.id||null,driver:driver?.name||'Unassigned',driverId:driver?.id||null,guide:guide?.name||'Unassigned',guideId:guide?.id||null,pickupLocation:form.pickupLocation,meetingInstructions:form.meetingInstructions,price:`${form.currency} ${amount}`,priceValue:Number(form.price),currency:form.currency,paymentStatus:form.paymentStatus,status:asInquiry?'Inquiry':form.status,source:'Supabase',notes:form.notes,accent:'#b59662'});clearDraft()}catch(error){setSaveError(error instanceof Error?error.message:'Unable to save booking.')}finally{setSaving(false)}
  }
  return <div className="page new-booking-page">
    <div className="form-page-heading"><button className="back-button" onClick={discardDraft}><span>‹</span> Back to bookings</button><div className="page-heading"><div><p className="eyebrow">BOOKINGS</p><h1>New booking</h1><p>Create a reservation and assign the operational details.</p></div></div></div>
    {Object.values(errors).some(Boolean)&&<div className="validation-banner"><strong>Some required information is missing.</strong><span>Review the highlighted fields before saving.</span></div>}
    <form className="booking-form" onSubmit={e=>{e.preventDefault();void submit()}} noValidate>
      <FormSection title="Booking information" description="Reference and current booking state."><FormGrid><FormField label="Booking number" required error={errors.id}><input className={errors.id?'invalid':''} value={form.id} onChange={e=>set('id')(e.target.value)}/></FormField><FormField label="Booking status"><select value={form.status} onChange={e=>set('status')(e.target.value)}><option>Inquiry</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select></FormField><FormField label="Booking date" required error={errors.bookingDate}><input className={errors.bookingDate?'invalid':''} type="date" value={form.bookingDate} onChange={e=>set('bookingDate')(e.target.value)}/></FormField></FormGrid></FormSection>
      <FormSection title="Customer" description="Primary company and contact information."><FormGrid><FormField label="Customer / company name" required error={errors.customerName}><input className={errors.customerName?'invalid':''} value={form.customerName} onChange={e=>set('customerName')(e.target.value)}/></FormField><FormField label="Contact person"><input value={form.contactPerson} onChange={e=>set('contactPerson')(e.target.value)}/></FormField><FormField label="Email"><input type="email" value={form.email} onChange={e=>set('email')(e.target.value)}/></FormField><FormField label="Phone"><input type="tel" value={form.phone} onChange={e=>set('phone')(e.target.value)}/></FormField></FormGrid></FormSection>
      <FormSection title="Cruise / ship information" description="Arrival context and departure point."><FormGrid><FormField label="Ship"><select value={form.ship} onChange={e=>{const next=e.target.value,nextShip=resources.ships.find(item=>item.id===next),line=resources.cruiseLines.find(item=>item.id===nextShip?.cruise_line_id);setForm(current=>({...current,ship:next,cruiseLine:line?.name||''}))}}><option value="">Unassigned</option>{resources.ships.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}</select></FormField><FormField label="Cruise line"><input value={form.cruiseLine} onChange={e=>set('cruiseLine')(e.target.value)}/></FormField><FormField label="Port / departure location" wide><input value={form.port} onChange={e=>set('port')(e.target.value)}/></FormField></FormGrid></FormSection>
      <FormSection title="Tour" description="Scheduled service and guest count."><FormGrid><FormField label="Tour" required error={errors.tour} wide><select className={errors.tour?'invalid':''} value={form.tour} onChange={e=>set('tour')(e.target.value)}><option value="">Select a tour</option>{resources.tours.filter(option=>option.active).map(option=><option key={option.id} value={option.id}>{option.name}</option>)}</select></FormField><FormField label="Tour date" required error={errors.tourDate}><input className={errors.tourDate?'invalid':''} type="date" value={form.tourDate} onChange={e=>set('tourDate')(e.target.value)}/></FormField><FormField label="Start time" required error={errors.startTime}><input className={errors.startTime?'invalid':''} type="time" value={form.startTime} onChange={e=>set('startTime')(e.target.value)}/></FormField><FormField label="End time" hint="Optional" error={errors.endTime}><input className={errors.endTime?'invalid':''} type="time" value={form.endTime} onChange={e=>set('endTime')(e.target.value)}/></FormField><FormField label="Number of guests" required error={errors.guests}><input className={errors.guests?'invalid':''} type="number" min="1" step="1" value={form.guests} onChange={e=>set('guests')(e.target.value)}/></FormField></FormGrid></FormSection>
      <FormSection title="Operations" description="Resource assignments and meeting details."><FormGrid><FormField label="Vehicle"><select value={form.vehicle} onChange={e=>set('vehicle')(e.target.value)}><option value="">Unassigned</option>{resources.vehicles.filter(option=>option.active).map(option=><option key={option.id} value={option.id}>{option.name}</option>)}</select></FormField><FormField label="Driver"><select value={form.driver} onChange={e=>set('driver')(e.target.value)}><option value="">Unassigned</option>{resources.staff.filter(person=>person.active&&person.can_drive).map(option=><option key={option.id} value={option.id}>{option.name}</option>)}</select></FormField><FormField label="Guide"><select value={form.guide} onChange={e=>set('guide')(e.target.value)}><option value="">Unassigned</option>{resources.staff.filter(person=>person.active&&person.can_guide).map(option=><option key={option.id} value={option.id}>{option.name}</option>)}</select></FormField><FormField label="Pickup location"><input value={form.pickupLocation} onChange={e=>set('pickupLocation')(e.target.value)}/></FormField><FormField label="Meeting instructions" hint="Optional" wide><textarea value={form.meetingInstructions} onChange={e=>set('meetingInstructions')(e.target.value)} placeholder="Signage, berth, or guest-specific instructions"/></FormField></FormGrid></FormSection>
      <FormSection title="Financial" description="Price and invoicing state."><FormGrid><FormField label="Price" error={errors.price}><input className={errors.price?'invalid':''} type="number" min="0" value={form.price} onChange={e=>set('price')(e.target.value)}/></FormField><FormField label="Currency"><select value={form.currency} onChange={e=>set('currency')(e.target.value)}><option>ISK</option><option>EUR</option><option>USD</option></select></FormField><FormField label="Payment / invoice status"><select value={form.paymentStatus} onChange={e=>set('paymentStatus')(e.target.value)}><option value="unpaid">Unpaid</option><option value="invoiced">Invoiced</option><option value="paid">Paid</option><option value="not_applicable">Not applicable</option></select></FormField></FormGrid></FormSection>
      <FormSection title="Additional information" description="Visible to the internal operations team only."><FormGrid><FormField label="Internal notes" wide><textarea value={form.notes} onChange={e=>set('notes')(e.target.value)} placeholder="Accessibility, dietary, timing, or supplier notes"/></FormField></FormGrid></FormSection>
      {saveError&&<div className="form-save-error">{saveError}</div>}<div className="form-actions"><button type="button" className="secondary-button" onClick={discardDraft} disabled={saving}>Cancel</button><div><button type="button" className="inquiry-button" onClick={()=>void submit(true)} disabled={saving}>Save as inquiry</button><button type="submit" className="primary-button" disabled={saving}>{saving?'Saving…':'Save booking'}</button></div></div>
    </form>
  </div>
}

function FormSection({title,description,children}:{title:string;description:string;children:React.ReactNode}){return <section className="form-section panel"><div className="form-section-heading"><h2>{title}</h2><p>{description}</p></div><div className="form-section-fields">{children}</div></section>}
function FormGrid({children}:{children:React.ReactNode}){return <div className="form-grid">{children}</div>}
function FormField({label,required=false,hint,error,wide=false,children}:{label:string;required?:boolean;hint?:string;error?:string;wide?:boolean;children:React.ReactNode}){return <label className={`form-field ${wide?'wide':''}`}><span>{label}{required&&<b>*</b>}{hint&&<small>{hint}</small>}</span>{children}{error&&<em>{error}</em>}</label>}

function Filter({label,value,onChange,options,all}:{label:string;value:string;onChange:(v:string)=>void;options:string[];all:string}){return <label className="filter-control"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}><option>{all}</option>{options.map(option=><option key={option}>{option}</option>)}</select></label>}

function BookingDetailPage({data,resources,onUpdate,onDelete}:{data:Booking[];resources:ResourceOptions;onUpdate:(booking:Booking)=>Promise<void>;onDelete:(booking:Booking)=>Promise<void>}){
  const {bookingId}=useParams(),navigate=useNavigate(),booking=data.find(item=>item.id===bookingId||item.uuid===bookingId)
  const confirm=useConfirmation()
  const bookingDraftKey=formDraftKey('booking',booking?.uuid||bookingId||'missing')
  const {value:draft,setValue:setDraft,dirty,restored,clearDraft}=useFormDraft<Booking|null>(bookingDraftKey,booking?{...booking}:null,booking?.updatedAt||'missing-booking')
  const [editing,setEditing]=useState(restored),[saving,setSaving]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('')
  const discardEdit=useDraftDiscard(dirty,clearDraft,()=>{setDraft(booking?{...booking}:null);setEditing(false);setError('')},'booking')
  if(!booking)return <div className="page record-not-found"><p className="eyebrow">BOOKINGS</p><h1>Booking not found</h1><p>This booking may have been removed or the address is incorrect.</p><button className="secondary-button" onClick={()=>navigate('/bookings')}>Back to bookings</button></div>
  const record=editing&&draft?draft:booking
  const change=(updates:Partial<Booking>)=>setDraft(current=>({...record,...current,...updates}))
  const beginEdit=()=>{setEditing(true);setError('');setSuccess('')}
  const save=async()=>{if(!draft||saving)return;const validationErrors=validateBooking(draft);if(validationErrors.length){setError(validationErrors.join(' '));return}setSaving(true);setError('');setSuccess('');try{await onUpdate(draft);clearDraft();setEditing(false);setSuccess('Booking changes saved successfully.');navigate(`/bookings/${encodeURIComponent(draft.id)}`,{replace:true})}catch(nextError){setError(nextError instanceof Error?nextError.message:'Unable to save booking.')}finally{setSaving(false)}}
  const cancelBooking=async()=>{if(booking.status==='Cancelled'||saving)return;setSaving(true);setError('');setSuccess('');try{await onUpdate({...booking,status:'Cancelled'});clearDraft();setEditing(false);setSuccess('Booking cancelled successfully.')}catch(nextError){throw new Error(nextError instanceof Error?nextError.message:'Unable to cancel booking.')}finally{setSaving(false)}}
  const requestCancel=()=>confirm({title:'Cancel booking?',message:`Booking ${booking.id} will remain in the system but will be removed from active operations.`,cancelLabel:'Keep booking',confirmLabel:'Cancel booking',destructive:true,onConfirm:cancelBooking})
  const requestDelete=()=>confirm({title:'Delete booking permanently?',message:`This action permanently removes booking ${booking.id} and cannot be undone.`,cancelLabel:'Keep booking',confirmLabel:'Delete permanently',destructive:true,onConfirm:async()=>{try{await onDelete(booking)}catch(nextError){throw new Error(nextError instanceof Error?nextError.message:'Unable to delete booking.')}}})
  const selectShip=(id:string)=>{const ship=resources.ships.find(item=>item.id===id),line=resources.cruiseLines.find(item=>item.id===ship?.cruise_line_id);change({ship:ship?.name||'Unassigned',shipId:ship?.id||null,cruiseLine:line?.name||''})}
  const selectTour=(id:string)=>{const tour=resources.tours.find(item=>item.id===id);if(tour)change({tour:tour.name,tourId:tour.id,tourDurationMinutes:tour.default_duration_minutes})}
  const selectVehicle=(id:string)=>{const resource=resources.vehicles.find(item=>item.id===id);change({vehicle:resource?.name||'Unassigned',vehicleId:resource?.id||null})}
  const selectStaff=(role:'driver'|'guide',id:string)=>{const person=resources.staff.find(item=>item.id===id);change(role==='driver'?{driver:person?.name||'Unassigned',driverId:person?.id||null}:{guide:person?.name||'Unassigned',guideId:person?.id||null})}
  return <div className="page booking-record-page">
    <button className="back-button record-back" onClick={()=>navigate('/bookings')}><span>‹</span> Back to bookings</button>
    <header className="record-header"><div><div className="record-title-line"><h1>{record.id}</h1><Status status={record.status}/></div><p>{record.date} · {record.time}{record.endTime?`–${record.endTime}`:''}</p></div><div className="record-header-actions">{editing?<><button className="secondary-button" onClick={discardEdit} disabled={saving}>Discard changes</button><button className="primary-button" onClick={()=>void save()} disabled={saving}>{saving?'Saving…':'Save changes'}</button></>:<button className="primary-button" onClick={beginEdit}>Edit booking</button>}</div></header>
    {success&&<div className="record-feedback success"><Icon name="check" size={16}/>{success}</div>}{error&&<div className="record-feedback error">! {error}</div>}
    <div className="record-grid">
      <RecordCard title="Booking information"><RecordFields><RecordField label="Booking number" value={record.id} editing={editing}><input value={record.id} onChange={e=>change({id:e.target.value})}/></RecordField><RecordField label="Status" value={record.status} editing={editing}><select value={record.status} onChange={e=>change({status:e.target.value as BookingStatus})}><option>Inquiry</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select></RecordField><RecordField label="Booking date" value={record.bookingDate||'—'} editing={editing}><input type="date" value={record.bookingDate||''} onChange={e=>change({bookingDate:e.target.value})}/></RecordField><RecordField label="Service date" value={record.date} editing={editing}><input type="date" value={record.serviceDate} onChange={e=>change({serviceDate:e.target.value,date:scheduleDate(e.target.value)})}/></RecordField><RecordField label="Start time" value={record.time} editing={editing}><input type="time" value={record.time} onChange={e=>change({time:e.target.value})}/></RecordField><RecordField label="End time" value={record.endTime||'—'} editing={editing}><input type="time" value={record.endTime||''} onChange={e=>change({endTime:e.target.value})}/></RecordField></RecordFields></RecordCard>
      <RecordCard title="Customer"><RecordFields><RecordField label="Customer / company" value={record.customer} editing={editing}><input value={record.customer} onChange={e=>change({customer:e.target.value})}/></RecordField><RecordField label="Contact person" value={record.contactPerson||'—'} editing={editing}><input value={record.contactPerson||''} onChange={e=>change({contactPerson:e.target.value})}/></RecordField><RecordField label="Email" value={record.email||'—'} editing={editing}><input type="email" value={record.email} onChange={e=>change({email:e.target.value})}/></RecordField><RecordField label="Phone" value={record.phone||'—'} editing={editing}><input value={record.phone} onChange={e=>change({phone:e.target.value})}/></RecordField></RecordFields></RecordCard>
      <RecordCard title="Tour / cruise" wide><RecordFields><RecordField label="Tour" value={record.tour} editing={editing}><select value={record.tourId} onChange={e=>selectTour(e.target.value)}>{resources.tours.filter(item=>item.active||item.id===record.tourId).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></RecordField><RecordField label="Ship" value={record.ship} editing={editing}><select value={record.shipId||''} onChange={e=>selectShip(e.target.value)}><option value="">Unassigned</option>{resources.ships.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></RecordField><RecordField label="Cruise line" value={record.cruiseLine||'—'}/><RecordField label="Port / departure" value={record.port||'—'} editing={editing}><input value={record.port||''} onChange={e=>change({port:e.target.value})}/></RecordField><RecordField label="Pickup location" value={record.pickupLocation||'—'} editing={editing}><input value={record.pickupLocation||''} onChange={e=>change({pickupLocation:e.target.value})}/></RecordField><RecordField label="Guests" value={String(record.guests)} editing={editing}><input type="number" min="1" step="1" value={record.guests} onChange={e=>change({guests:Number(e.target.value)})}/></RecordField><RecordField label="Meeting instructions" value={record.meetingInstructions||'—'} editing={editing} wide><textarea value={record.meetingInstructions||''} onChange={e=>change({meetingInstructions:e.target.value})}/></RecordField></RecordFields></RecordCard>
      <RecordCard title="Operations"><RecordFields><RecordField label="Vehicle" value={record.vehicle} editing={editing}><select value={record.vehicleId||''} onChange={e=>selectVehicle(e.target.value)}><option value="">Unassigned</option>{resources.vehicles.filter(item=>item.active||item.id===record.vehicleId).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></RecordField><RecordField label="Driver" value={record.driver} editing={editing}><select value={record.driverId||''} onChange={e=>selectStaff('driver',e.target.value)}><option value="">Unassigned</option>{resources.staff.filter(item=>(item.active&&item.can_drive)||item.id===record.driverId).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></RecordField><RecordField label="Guide" value={record.guide} editing={editing}><select value={record.guideId||''} onChange={e=>selectStaff('guide',e.target.value)}><option value="">Unassigned</option>{resources.staff.filter(item=>(item.active&&item.can_guide)||item.id===record.guideId).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></RecordField></RecordFields></RecordCard>
      <RecordCard title="Financial"><RecordFields><RecordField label="Price" value={record.price} editing={editing}><input type="number" min="0" value={record.priceValue} onChange={e=>{const value=Number(e.target.value);change({priceValue:value,price:`${record.currency||'ISK'} ${value.toLocaleString('en-US')}`})}}/></RecordField><RecordField label="Currency" value={record.currency||'ISK'} editing={editing}><select value={record.currency||'ISK'} onChange={e=>change({currency:e.target.value,price:`${e.target.value} ${record.priceValue.toLocaleString('en-US')}`})}><option>ISK</option><option>EUR</option><option>USD</option></select></RecordField><RecordField label="Payment status" value={(record.paymentStatus||'unpaid').replace('_',' ')} editing={editing}><select value={record.paymentStatus||'unpaid'} onChange={e=>change({paymentStatus:e.target.value})}><option value="unpaid">Unpaid</option><option value="invoiced">Invoiced</option><option value="paid">Paid</option><option value="not_applicable">Not applicable</option></select></RecordField></RecordFields></RecordCard>
      <RecordCard title="Internal notes" wide><RecordField label="Internal notes" value={record.notes||'No internal notes.'} editing={editing} wide><textarea className="record-notes-input" value={record.notes} onChange={e=>change({notes:e.target.value})}/></RecordField></RecordCard>
    </div>
    <div className="record-danger-zone"><div className="record-danger-copy"><strong>Booking actions</strong><p>Cancellation preserves history. Permanent deletion cannot be undone.</p></div><div className="record-danger-actions"><button className="secondary-button" onClick={requestCancel} disabled={record.status==='Cancelled'||saving||editing}>{record.status==='Cancelled'?'Booking cancelled':'Cancel booking'}</button><button className="danger-button" onClick={requestDelete} disabled={saving||editing}>Delete booking</button></div></div>
  </div>
}
function RecordCard({title,wide=false,children}:{title:string;wide?:boolean;children:React.ReactNode}){return <section className={`record-card panel ${wide?'wide':''}`}><h2>{title}</h2>{children}</section>}
function RecordFields({children}:{children:React.ReactNode}){return <div className="record-fields">{children}</div>}
function RecordField({label,value,editing=false,wide=false,children}:{label:string;value:string;editing?:boolean;wide?:boolean;children?:React.ReactNode}){return <label className={`record-field ${wide?'wide':''}`}><span>{label}</span>{editing&&children?children:<strong>{value}</strong>}</label>}

function BookingTable({data,compact=false,onSelect,emptyMessage='No bookings match your filters.'}:{data:Booking[];compact?:boolean;onSelect?:(booking:Booking)=>void;emptyMessage?:string}){return <div className="booking-table-responsive"><div className="table-scroll"><table className={compact?'compact':'bookings-table'}><thead><tr>{compact?<><th>CUSTOMER</th><th>TOUR</th><th>DATE & TIME</th><th>GUESTS</th><th>STATUS</th></>:<><th>BOOKING</th><th>DATE / START</th><th>SHIP / CRUISE LINE</th><th>TOUR</th><th>CUSTOMER</th><th>GUESTS</th><th>VEHICLE</th><th>DRIVER</th><th>PRICE</th><th>STATUS</th></>}<th><span className="sr-only">Open</span></th></tr></thead><tbody>{data.map(b=><tr key={b.id} className={onSelect?'clickable-row':''} onClick={()=>onSelect?.(b)} tabIndex={onSelect?0:undefined} onKeyDown={event=>{if(event.currentTarget===event.target&&(event.key==='Enter'||event.key===' '))onSelect?.(b)}}>{compact?<><td><div className="guest-cell"><span className="guest-avatar" style={{'--avatar':b.accent} as React.CSSProperties}>{b.initials}</span><span><strong>{b.customer}</strong><small>{b.id} · {b.country}</small></span></div></td><td><strong className="tour-name">{b.tour}</strong><small className="source">via {b.source}</small></td><td><strong>{b.date}</strong><small>{b.time}</small></td><td><span className="guest-count"><Icon name="people" size={15}/>{b.guests}</span></td><td><Status status={b.status}/></td></>:<><td><strong className="booking-id">{b.id}</strong><small>{b.source}</small></td><td><strong>{b.date}</strong><small>{b.time}</small></td><td><strong>{b.ship}</strong><small>{b.cruiseLine}</small></td><td><strong className="tour-name">{b.tour}</strong></td><td><div className="guest-cell"><span className="guest-avatar" style={{'--avatar':b.accent} as React.CSSProperties}>{b.initials}</span><span><strong>{b.customer}</strong><small>{b.country}</small></span></div></td><td><span className="guest-count"><Icon name="people" size={15}/>{b.guests}</span></td><td><strong>{b.vehicle}</strong></td><td><strong>{b.driver}</strong></td><td><strong>{b.price}</strong></td><td><Status status={b.status}/></td></>}<td><button className="row-arrow" onClick={e=>{e.stopPropagation();onSelect?.(b)}} aria-label={`Open booking ${b.id}`}><Icon name="arrow" size={16}/></button></td></tr>)}{!data.length&&<tr><td colSpan={compact?6:11} className="empty-state">{emptyMessage}</td></tr>}</tbody></table></div><div className="booking-mobile-list">{data.map(b=><button key={b.id} className="booking-mobile-card" onClick={()=>onSelect?.(b)}><span className="booking-mobile-head"><strong>{b.id}</strong><Status status={b.status}/></span><span className="booking-mobile-tour">{b.tour}</span><span className="booking-mobile-customer">{b.customer}</span><span className="booking-mobile-meta"><span>{b.date} · {b.time}</span><span><Icon name="people" size={14}/>{b.guests}</span></span></button>)}{!data.length&&<div className="booking-mobile-empty">{emptyMessage}</div>}</div></div>}
export default App
