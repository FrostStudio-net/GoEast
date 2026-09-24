import { useMemo, useState } from 'react'
import './App.css'

type IconName = 'grid'|'bookings'|'schedule'|'calendar'|'tours'|'ship'|'vehicle'|'drivers'|'customers'|'search'|'bell'|'plus'|'arrow'|'clock'|'people'|'check'|'chevron'|'menu'|'close'
type BookingStatus = 'Inquiry' | 'Confirmed' | 'Completed' | 'Cancelled'
type Booking = {
  id:string; customer:string; initials:string; email:string; phone:string; country:string;
  date:string; time:string; ship:string; cruiseLine:string; tour:string; guests:number;
  vehicle:string; driver:string; guide:string; price:string; status:BookingStatus;
  source:string; notes:string; accent:string; bookingDate?:string; contactPerson?:string;
  port?:string; endTime?:string; pickupLocation?:string; meetingInstructions?:string;
  currency?:string; paymentStatus?:string
}

const bookings: Booking[] = [
  { id:'GE-260924-01', customer:'Elliot Hansen', initials:'EH', email:'elliot.hansen@email.dk', phone:'+45 22 84 19 03', country:'Denmark', date:'24 Sep 2026', time:'08:30', ship:'Viking Neptune', cruiseLine:'Viking Ocean Cruises', tour:'Stuðlagil Canyon Adventure', guests:4, vehicle:'GE-03 · Sprinter', driver:'Árni Pálsson', guide:'Sara Jónsdóttir', price:'ISK 156,000', status:'Confirmed', source:'Ship agent', notes:'Meet at Berth 2 with GoEast sign. One guest has limited mobility; allow extra time at viewpoints.', accent:'#7f9e7a' },
  { id:'GE-260924-02', customer:'Mia Thompson', initials:'MT', email:'mia.thompson@outlook.com', phone:'+44 7700 903118', country:'United Kingdom', date:'24 Sep 2026', time:'09:00', ship:'Celebrity Silhouette', cruiseLine:'Celebrity Cruises', tour:'Nature & Wildlife RIB Safari', guests:8, vehicle:'GE-06 · Crafter', driver:'Unassigned', guide:'Elín Róbertsdóttir', pickupLocation:'Tender harbour', price:'ISK 248,000', status:'Inquiry', source:'Direct', notes:'Awaiting final passenger manifest. Guests require waterproof overalls in mixed sizes.', accent:'#bb8b73' },
  { id:'GE-260924-03', customer:'Noah Williams', initials:'NW', email:'noah.williams@gmail.com', phone:'+1 415 555 0186', country:'United States', date:'24 Sep 2026', time:'10:30', ship:'Rotterdam', cruiseLine:'Holland America Line', tour:'Eastfjords Private Explorer', guests:6, vehicle:'GE-01 · Defender', driver:'Unassigned', guide:'Sara Jónsdóttir', pickupLocation:'Seyðisfjörður cruise terminal', price:'ISK 252,000', status:'Confirmed', source:'Ship agent', notes:'Private family group. Child seat needed for one 5-year-old. Lunch booked at Hotel Aldan.', accent:'#77879f' },
  { id:'GE-260925-01', customer:'Emilia Rossi', initials:'ER', email:'emilia.rossi@email.it', phone:'+39 340 882 1044', country:'Italy', date:'25 Sep 2026', time:'08:00', ship:'Regal Princess', cruiseLine:'Princess Cruises', tour:'Seyðisfjörður Scenic Tour', guests:12, vehicle:'GE-08 · Sprinter', driver:'Magnús Þórsson', guide:'Anna María Helgadóttir', price:'ISK 318,000', status:'Confirmed', source:'DMC partner', notes:'Italian-speaking guide requested. Return to ship no later than 12:15.', accent:'#9b7f8b' },
  { id:'GE-260925-02', customer:'Lucas Martin', initials:'LM', email:'lucas.martin@email.fr', phone:'+33 6 12 44 78 20', country:'France', date:'25 Sep 2026', time:'09:30', ship:'Costa Favolosa', cruiseLine:'Costa Cruises', tour:'Vök Baths & Highland Circle', guests:5, vehicle:'GE-05 · Land Cruiser', driver:'Sara Björnsdóttir', guide:'Katrín Ólafsdóttir', price:'ISK 215,000', status:'Completed', source:'Viator', notes:'Tour completed on schedule. Guest complimented guide and vehicle comfort.', accent:'#9a8a6d' },
  { id:'GE-260926-01', customer:'Sofia Klein', initials:'SK', email:'sofia.klein@email.de', phone:'+49 151 220 1842', country:'Germany', date:'26 Sep 2026', time:'08:15', ship:'Viking Mars', cruiseLine:'Viking Ocean Cruises', tour:'Stuðlagil Canyon Adventure', guests:9, vehicle:'Unassigned', driver:'Bjarni Karlsson', guide:'Elín Róbertsdóttir', pickupLocation:'Berth 1', price:'ISK 297,000', status:'Inquiry', source:'Ship agent', notes:'Provisional request. Confirm ship arrival time before assigning final pickup point.', accent:'#6d8d8f' },
  { id:'GE-260926-02', customer:'Charlotte Reed', initials:'CR', email:'charlotte.reed@mail.com', phone:'+44 7700 903442', country:'United Kingdom', date:'26 Sep 2026', time:'09:00', ship:'Regal Princess', cruiseLine:'Princess Cruises', tour:'Nature & Wildlife RIB Safari', guests:10, vehicle:'GE-07 · Sprinter', driver:'Árni Pálsson', guide:'Unassigned', pickupLocation:'Tender harbour', price:'ISK 290,000', status:'Cancelled', source:'Direct', notes:'Cancelled after cruise line removed the port call due to weather.', accent:'#887c91' },
  { id:'GE-260927-01', customer:'Oliver Chen', initials:'OC', email:'oliver.chen@email.ca', phone:'+1 604 555 0119', country:'Canada', date:'27 Sep 2026', time:'08:45', ship:'Celebrity Silhouette', cruiseLine:'Celebrity Cruises', tour:'Seyðisfjörður Scenic Tour', guests:7, vehicle:'GE-02 · Transit', driver:'Hrafn Eiríksson', guide:'Anna María Helgadóttir', price:'ISK 203,000', status:'Confirmed', source:'GetYourGuide', notes:'Vegetarian lunch for two guests. Pickup at tender landing.', accent:'#8a9672' },
  { id:'GE-260927-02', customer:'Isabelle Moreau', initials:'IM', email:'isabelle.moreau@email.fr', phone:'+33 6 80 52 18 42', country:'France', date:'27 Sep 2026', time:'10:00', ship:'Rotterdam', cruiseLine:'Holland America Line', tour:'Vök Baths & Highland Circle', guests:4, vehicle:'GE-05 · Land Cruiser', driver:'Sara Björnsdóttir', guide:'Katrín Ólafsdóttir', price:'ISK 176,000', status:'Confirmed', source:'Direct', notes:'Vök admission confirmed. Bring two booster seats.', accent:'#9b866c' },
]
const toursToday = [
  { time:'08:30', name:'Stuðlagil Canyon Adventure', meta:'Elliot Hansen · 4 guests', guide:'Árni', color:'#d8a83f' },
  { time:'09:00', name:'Vök Baths & Highland Circle', meta:'Mia Thompson · 2 guests', guide:'Sara', color:'#8c9f7b' },
  { time:'10:30', name:'Eastfjords Private Explorer', meta:'Noah Williams · 6 guests', guide:'Jón', color:'#7891ad' },
]
const nav = [
  {label:'Dashboard',icon:'grid' as IconName},{label:'Bookings',icon:'bookings' as IconName},{label:'Daily schedule',icon:'schedule' as IconName},{label:'Calendar',icon:'calendar' as IconName},{label:'Tours',icon:'tours' as IconName},{label:'Ships',icon:'ship' as IconName},{label:'Vehicles',icon:'vehicle' as IconName},{label:'Drivers',icon:'drivers' as IconName},{label:'Customers',icon:'customers' as IconName},
]

function Icon({name,size=18}:{name:IconName;size?:number}){
  const paths:Record<IconName,React.ReactNode>={
    grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    bookings:<><path d="M7 3h10v4H7z"/><path d="M5 5H4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1"/><path d="M7 12h10M7 16h6"/></>,schedule:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></>,tours:<><path d="M3 19 8 5l4 8 3-5 6 11Z"/><path d="m7 9 2 2 2-3"/></>,ship:<><path d="m3 14 2 6h14l2-6-9-4Z"/><path d="M8 11V5h8v6M12 5V2M3 22c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1"/></>,vehicle:<><path d="m5 17-2-2 2-6h14l2 6-2 2Z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M6 9 8 5h8l2 4"/></>,drivers:<><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0M4 12H2m20 0h-2"/></>,customers:<><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 8M18 15a6 6 0 0 1 4 6"/></>,search:<><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,plus:<path d="M12 5v14M5 12h14"/>,arrow:<path d="m9 18 6-6-6-6"/>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5h4"/></>,people:<><circle cx="9" cy="9" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20a6 6 0 0 1 12 0M15 15a5 5 0 0 1 6 5"/></>,check:<path d="m5 12 4 4L19 6"/>,chevron:<path d="m9 18 6-6-6-6"/>,menu:<path d="M4 7h16M4 12h16M4 17h16"/>,close:<path d="m6 6 12 12M18 6 6 18"/>,
  }
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
function Status({status}:{status:BookingStatus}){return <span className={`status status-${status.toLowerCase()}`}><span/>{status}</span>}

function App(){
  const [page,setPage]=useState('Dashboard'),[menuOpen,setMenuOpen]=useState(false),[bookingRecords,setBookingRecords]=useState(bookings)
  const navigate=(label:string)=>{if(label==='Dashboard'||label==='Bookings'||label==='Daily schedule')setPage(label);setMenuOpen(false)}
  const createBooking=(booking:Booking)=>{setBookingRecords(items=>[booking,...items]);setPage('Bookings')}
  const updateBooking=(booking:Booking)=>setBookingRecords(items=>items.map(item=>item.id===booking.id?booking:item))
  return <div className="app-shell">
    {menuOpen&&<button className="scrim" aria-label="Close navigation" onClick={()=>setMenuOpen(false)}/>}<aside className={`sidebar ${menuOpen?'sidebar-open':''}`}>
      <div className="brand-row"><button className="brand" onClick={()=>navigate('Dashboard')} aria-label="GoEast dashboard"><img className="brand-logo" src="/goeast-logo.png" alt="GoEast" /></button><button className="mobile-close" onClick={()=>setMenuOpen(false)} aria-label="Close menu"><Icon name="close"/></button></div>
      <nav aria-label="Main navigation"><p className="nav-label">WORKSPACE</p>{nav.slice(0,4).map(i=><NavItem key={i.label} item={i} page={page} onClick={navigate}/>)}<p className="nav-label nav-label-spaced">RESOURCES</p>{nav.slice(4).map(i=><NavItem key={i.label} item={i} page={page} onClick={navigate}/>)}</nav>
      <div className="sidebar-footer"><div className="help-card"><span className="help-icon">?</span><div><strong>Need a hand?</strong><small>View operations guide</small></div><Icon name="arrow" size={15}/></div><button className="profile"><span className="avatar">ÁÁ</span><span><strong>Ásgrímur.</strong><small>Administrator</small></span><Icon name="chevron" size={16}/></button></div>
    </aside>
    <main className="main"><header className="topbar"><button className="menu-button" onClick={()=>setMenuOpen(true)} aria-label="Open navigation"><Icon name="menu" size={21}/></button><div className="global-search"><Icon name="search" size={17}/><input aria-label="Search everything" placeholder="Search bookings, customers..."/><kbd>⌘ K</kbd></div><div className="topbar-actions"><span className="live-indicator"><i/>Operations live</span><button className="icon-button" aria-label="Notifications"><Icon name="bell"/><b>3</b></button><span className="top-avatar">KG</span></div></header>
      {page==='Bookings'?<BookingsPage data={bookingRecords} onUpdate={updateBooking} onNewBooking={()=>setPage('New booking')}/>:page==='New booking'?<NewBookingPage onSave={createBooking} onCancel={()=>setPage('Bookings')} existingCount={bookingRecords.length}/>:page==='Daily schedule'?<DailySchedulePage data={bookingRecords} onUpdate={updateBooking}/>:<Dashboard data={bookingRecords} onViewBookings={()=>setPage('Bookings')} onNewBooking={()=>setPage('New booking')}/>}</main>
  </div>
}
function NavItem({item,page,onClick}:{item:typeof nav[number];page:string;onClick:(l:string)=>void}){const enabled=item.label==='Dashboard'||item.label==='Bookings'||item.label==='Daily schedule',active=page===item.label||(page==='New booking'&&item.label==='Bookings');return <button className={`nav-item ${active?'active':''}`} onClick={()=>onClick(item.label)} title={enabled?undefined:'Coming in the next build'}><Icon name={item.icon}/><span>{item.label}</span>{!enabled&&<small>SOON</small>}</button>}

function Dashboard({data,onViewBookings,onNewBooking}:{data:Booking[];onViewBookings:()=>void;onNewBooking:()=>void}){return <div className="page dashboard-page">
  <div className="page-heading"><div><p className="eyebrow">THURSDAY, 24 SEPTEMBER</p><h1>Good morning, Ásgrímur.</h1><p>Here’s what’s happening across GoEast today.</p></div><button className="primary-button" onClick={onNewBooking}><Icon name="plus" size={17}/>New booking</button></div>
  <section className="stats-grid"><Stat icon="bookings" label="TODAY’S BOOKINGS" value="8" detail="2 awaiting confirmation" tone="gold"/><Stat icon="people" label="GUESTS TODAY" value="27" detail="Across 6 tour groups" tone="green"/><Stat icon="tours" label="TOURS DEPARTING" value="6" detail="First departure 08:30" tone="blue"/><Stat icon="drivers" label="UNASSIGNED BOOKINGS" value="3" detail="2 missing driver · 1 missing vehicle" tone="purple"/></section>
  <div className="dashboard-grid"><section className="panel schedule-panel"><div className="panel-header"><div><p className="eyebrow">TODAY’S OPERATIONS</p><h2>Upcoming departures</h2></div><button className="text-button">View schedule <Icon name="arrow" size={15}/></button></div><div className="departures">{toursToday.map(t=><article className="departure" key={t.time}><div className="tour-time"><strong>{t.time}</strong><small>Today</small></div><span className="timeline-dot" style={{'--dot':t.color} as React.CSSProperties}/><div className="tour-info"><strong>{t.name}</strong><small>{t.meta}</small></div><span className="guide-avatar">{t.guide[0]}</span><div className="guide"><small>GUIDE</small><strong>{t.guide}</strong></div><button className="row-arrow" aria-label={`Open ${t.name}`}><Icon name="arrow" size={16}/></button></article>)}</div><div className="schedule-note"><Icon name="clock" size={17}/><span>Next departure in <strong>1 hour 42 minutes</strong></span></div></section>
    <section className="panel fleet-panel"><div className="panel-header"><div><p className="eyebrow">FLEET STATUS</p><h2>Vehicles</h2></div><button className="more-button" aria-label="More vehicle options">•••</button></div><div className="fleet-list"><Fleet name="GE-01 · Defender" meta="Jón · Eastfjords Explorer" status="On tour" tone="green"/><Fleet name="GE-03 · Sprinter" meta="Árni · Stuðlagil Canyon" status="Departing" tone="gold"/><Fleet name="GE-05 · Land Cruiser" meta="Available at base" status="Available" tone="blue"/><Fleet name="GE-02 · Transit" meta="Service due 28 Sep" status="Maintenance" tone="gray"/></div><button className="full-text-button">Manage fleet <Icon name="arrow" size={15}/></button></section></div>
  <section className="panel recent-panel"><div className="panel-header"><div><p className="eyebrow">LATEST ACTIVITY</p><h2>Recent bookings</h2></div><button className="text-button" onClick={onViewBookings}>View all bookings <Icon name="arrow" size={15}/></button></div><BookingTable data={data.slice(0,4)} compact/></section>
</div>}

type ConflictMap = Map<string,string[]>
const scheduleDate=(iso:string)=>{if(!iso)return '';const [year,month,day]=iso.split('-');return `${day} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(month)-1]} ${year}`}
const timeMinutes=(value:string)=>{const [hours,minutes]=value.split(':').map(Number);return hours*60+minutes}
function findConflicts(items:Booking[]):ConflictMap{
  const conflicts:ConflictMap=new Map()
  const active=items.filter(item=>item.status!=='Cancelled')
  for(let left=0;left<active.length;left++)for(let right=left+1;right<active.length;right++){
    const a=active[left],b=active[right],aStart=timeMinutes(a.time),bStart=timeMinutes(b.time),aEnd=a.endTime?timeMinutes(a.endTime):aStart+180,bEnd=b.endTime?timeMinutes(b.endTime):bStart+180
    if(aStart>=bEnd||bStart>=aEnd)continue
    ;(['vehicle','driver','guide'] as const).forEach(resource=>{
      if(!a[resource]||a[resource]==='Unassigned'||a[resource]!==b[resource])return
      const label=`${resource[0].toUpperCase()}${resource.slice(1)} conflict · ${a[resource]}`
      conflicts.set(a.id,[...(conflicts.get(a.id)||[]),label]);conflicts.set(b.id,[...(conflicts.get(b.id)||[]),label])
    })
  }
  return conflicts
}

function DailySchedulePage({data,onUpdate}:{data:Booking[];onUpdate:(booking:Booking)=>void}){
  const [selectedDate,setSelectedDate]=useState('2026-09-24')
  const [ship,setShip]=useState('All ships'),[tour,setTour]=useState('All tours'),[driver,setDriver]=useState('All drivers'),[vehicle,setVehicle]=useState('All vehicles'),[status,setStatus]=useState('All statuses')
  const [selected,setSelected]=useState<Booking|null>(null),[editing,setEditing]=useState(false),[draft,setDraft]=useState<Booking|null>(null)
  const dateLabel=scheduleDate(selectedDate)
  const dayBookings=useMemo(()=>data.filter(item=>item.date===dateLabel).sort((a,b)=>a.time.localeCompare(b.time)),[data,dateLabel])
  const conflicts=useMemo(()=>findConflicts(dayBookings),[dayBookings])
  const filtered=dayBookings.filter(item=>(ship==='All ships'||item.ship===ship)&&(tour==='All tours'||item.tour===tour)&&(driver==='All drivers'||item.driver===driver)&&(vehicle==='All vehicles'||item.vehicle===vehicle)&&(status==='All statuses'||item.status===status))
  const active=dayBookings.filter(item=>item.status!=='Cancelled')
  const unassigned=active.filter(item=>[item.vehicle,item.driver,item.guide].some(value=>!value||value==='Unassigned')).length
  const unique=(key:'ship'|'tour'|'driver'|'vehicle')=>[...new Set(data.map(item=>item[key]))].sort()
  const moveDay=(days:number)=>{const value=new Date(`${selectedDate}T12:00:00`);value.setDate(value.getDate()+days);setSelectedDate(value.toISOString().slice(0,10))}
  const openBooking=(booking:Booking)=>{setSelected(booking);setDraft(booking);setEditing(false)}
  const closeBooking=()=>{setSelected(null);setDraft(null);setEditing(false)}
  const saveBooking=()=>{if(!draft)return;onUpdate(draft);setSelected(draft);setEditing(false)}
  const cancelBooking=()=>{if(!selected)return;const cancelled={...selected,status:'Cancelled' as BookingStatus};onUpdate(cancelled);setSelected(cancelled);setDraft(cancelled);setEditing(false)}
  return <div className="page schedule-page">
    <div className="schedule-heading"><div><p className="eyebrow">OPERATIONS</p><h1>Daily schedule</h1><p className="print-date">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p></div><div className="schedule-header-actions"><div className="date-nav"><button onClick={()=>moveDay(-1)} aria-label="Previous day">‹</button><button className="today-button" onClick={()=>setSelectedDate(new Date().toISOString().slice(0,10))}>Today</button><button onClick={()=>moveDay(1)} aria-label="Next day">›</button><label><span className="sr-only">Select date</span><input type="date" value={selectedDate} onChange={e=>{if(e.target.value)setSelectedDate(e.target.value)}}/></label></div><button className="secondary-button print-button" onClick={()=>window.print()}>Print day sheet</button></div></div>
    <section className="schedule-stats"><ScheduleStat label="Departures" value={active.length} icon="schedule" tone="gold"/><ScheduleStat label="Guests" value={active.reduce((sum,item)=>sum+item.guests,0)} icon="people" tone="green"/><ScheduleStat label="Unassigned" value={unassigned} icon="drivers" tone="purple" alert={unassigned>0}/><ScheduleStat label="Conflicts" value={conflicts.size} icon="clock" tone="red" alert={conflicts.size>0}/></section>
    <section className="panel schedule-workspace">
      <div className="schedule-filters"><Filter label="Ship" value={ship} onChange={setShip} options={unique('ship')} all="All ships"/><Filter label="Tour" value={tour} onChange={setTour} options={unique('tour')} all="All tours"/><Filter label="Driver" value={driver} onChange={setDriver} options={unique('driver')} all="All drivers"/><Filter label="Vehicle" value={vehicle} onChange={setVehicle} options={unique('vehicle')} all="All vehicles"/><Filter label="Status" value={status} onChange={setStatus} options={['Inquiry','Confirmed','Completed','Cancelled']} all="All statuses"/></div>
      <div className="schedule-list"><div className="schedule-list-head"><span>TIME</span><span>TOUR / SHIP</span><span>BOOKING / CUSTOMER</span><span>GUESTS</span><span>OPERATIONS</span><span>PICKUP</span><span>STATUS</span></div>{filtered.map((booking,index)=><ScheduleRow key={booking.id} booking={booking} conflicts={conflicts.get(booking.id)||[]} first={index===0} last={index===filtered.length-1} onClick={()=>openBooking(booking)}/>)}{!filtered.length&&<div className="schedule-empty"><Icon name="calendar" size={25}/><strong>No departures scheduled</strong><span>There are no bookings matching this date and filter set.</span></div>}</div>
    </section>
    {selected&&draft&&<BookingDetail booking={editing?draft:selected} editing={editing} onChange={setDraft} onClose={closeBooking} onEdit={()=>setEditing(true)} onSave={saveBooking} onCancelEdit={()=>{setDraft(selected);setEditing(false)}} onCancelBooking={cancelBooking}/>}
  </div>
}

function ScheduleStat({label,value,icon,tone,alert=false}:{label:string;value:number;icon:IconName;tone:string;alert?:boolean}){return <article className={`schedule-stat ${alert?'has-alert':''}`}><span className={`schedule-stat-icon tone-${tone}`}><Icon name={icon} size={17}/></span><div><span>{label}</span><strong>{value}</strong></div></article>}
function Assignment({label,value}:{label:string;value:string}){const missing=!value||value==='Unassigned';return <span className={`assignment ${missing?'missing':''}`}><small>{label}</small><strong>{missing?`No ${label.toLowerCase()} assigned`:value}</strong></span>}
function ScheduleRow({booking,conflicts,first,last,onClick}:{booking:Booking;conflicts:string[];first:boolean;last:boolean;onClick:()=>void}){return <article className={`schedule-row ${booking.status==='Cancelled'?'is-cancelled':''}`} onClick={onClick} tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')onClick()}}><div className="schedule-time"><span className={`schedule-node ${first?'first':''} ${last?'last':''}`}/><strong>{booking.time}</strong><small>{booking.endTime||'≈ 3 hrs'}</small></div><div className="schedule-tour"><strong>{booking.tour}</strong><small>{booking.ship} · {booking.cruiseLine}</small>{conflicts.length>0&&<div className="conflict-badges">{conflicts.map(message=><span key={message}>! {message}</span>)}</div>}</div><div className="schedule-booking"><strong>{booking.id}</strong><small>{booking.customer}</small></div><div className="schedule-guests"><Icon name="people" size={15}/><strong>{booking.guests}</strong></div><div className="schedule-assignments"><Assignment label="Vehicle" value={booking.vehicle}/><Assignment label="Driver" value={booking.driver}/><Assignment label="Guide" value={booking.guide}/></div><div className="schedule-pickup"><strong>{booking.pickupLocation||booking.port||'Cruise terminal'}</strong><small>{booking.ship}</small></div><div className="schedule-row-status"><Status status={booking.status}/><button className="row-arrow" aria-label={`Open booking ${booking.id}`}><Icon name="arrow" size={16}/></button></div></article>}

function Stat({icon,label,value,detail,tone}:{icon:IconName;label:string;value:string;detail:string;tone:string}){return <article className="stat-card"><div className={`stat-icon tone-${tone}`}><Icon name={icon} size={19}/></div><p className="eyebrow">{label}</p><strong className="stat-value">{value}</strong><p className="stat-detail">{detail}</p></article>}
function Fleet({name,meta,status,tone}:{name:string;meta:string;status:string;tone:string}){return <div className="fleet-row"><span className={`vehicle-icon tone-${tone}`}><Icon name="vehicle" size={18}/></span><div><strong>{name}</strong><small>{meta}</small></div><span className={`fleet-status ${tone}`}>{status}</span></div>}
function BookingsPage({data,onUpdate,onNewBooking}:{data:Booking[];onUpdate:(booking:Booking)=>void;onNewBooking:()=>void}){
  const [query,setQuery]=useState(''),[date,setDate]=useState('All dates'),[status,setStatus]=useState('All statuses'),[ship,setShip]=useState('All ships'),[tour,setTour]=useState('All tours'),[driver,setDriver]=useState('All drivers')
  const [selected,setSelected]=useState<Booking|null>(null),[editing,setEditing]=useState(false),[draft,setDraft]=useState<Booking|null>(null)
  const unique=(key:'ship'|'tour'|'driver')=>[...new Set(data.map(item=>item[key]))]
  const filtered=useMemo(()=>data.filter(b=>{
    const matchesSearch=`${b.id} ${b.customer} ${b.ship} ${b.tour} ${b.driver}`.toLowerCase().includes(query.toLowerCase())
    const matchesDate=date==='All dates'||b.date===date
    return matchesSearch&&matchesDate&&(status==='All statuses'||b.status===status)&&(ship==='All ships'||b.ship===ship)&&(tour==='All tours'||b.tour===tour)&&(driver==='All drivers'||b.driver===driver)
  }),[data,query,date,status,ship,tour,driver])
  const hasFilters=query||date!=='All dates'||status!=='All statuses'||ship!=='All ships'||tour!=='All tours'||driver!=='All drivers'
  const clearFilters=()=>{setQuery('');setDate('All dates');setStatus('All statuses');setShip('All ships');setTour('All tours');setDriver('All drivers')}
  const openBooking=(booking:Booking)=>{setSelected(booking);setDraft(booking);setEditing(false)}
  const closeBooking=()=>{setSelected(null);setDraft(null);setEditing(false)}
  const saveBooking=()=>{if(!draft)return;onUpdate(draft);setSelected(draft);setEditing(false)}
  const cancelBooking=()=>{if(!selected)return;const cancelled={...selected,status:'Cancelled' as BookingStatus};onUpdate(cancelled);setSelected(cancelled);setDraft(cancelled);setEditing(false)}
  return <div className="page bookings-page">
    <div className="page-heading"><div><p className="eyebrow">OPERATIONS</p><h1>Bookings</h1><p>Manage cruise calls, guest reservations, and tour assignments.</p></div><button className="primary-button" onClick={onNewBooking}><Icon name="plus" size={17}/>New booking</button></div>
    <section className="booking-summary"><div><span>All bookings</span><strong>{data.length}</strong></div><div><span>Confirmed</span><strong>{data.filter(b=>b.status==='Confirmed').length}</strong></div><div><span>Open inquiries</span><strong className="gold-text">{data.filter(b=>b.status==='Inquiry').length}</strong></div><div><span>Booked revenue</span><strong>ISK 1.96m</strong></div></section>
    <section className="panel bookings-panel">
      <div className="booking-toolbar booking-toolbar-primary"><label className="table-search"><Icon name="search" size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search booking, customer, ship, tour..." aria-label="Search bookings"/></label><div className="result-count"><strong>{filtered.length}</strong> results</div>{hasFilters&&<button className="clear-filters" onClick={clearFilters}>Clear filters</button>}</div>
      <div className="filter-row">
        <Filter label="Date" value={date} onChange={setDate} options={[...new Set(data.map(b=>b.date))]} all="All dates"/>
        <Filter label="Status" value={status} onChange={setStatus} options={['Inquiry','Confirmed','Completed','Cancelled']} all="All statuses"/>
        <Filter label="Ship" value={ship} onChange={setShip} options={unique('ship')} all="All ships"/>
        <Filter label="Tour" value={tour} onChange={setTour} options={unique('tour')} all="All tours"/>
        <Filter label="Driver" value={driver} onChange={setDriver} options={unique('driver')} all="All drivers"/>
      </div>
      <BookingTable data={filtered} onSelect={openBooking}/>
      <div className="table-footer"><span>Showing {filtered.length} of {data.length} bookings</span><div><button disabled>Previous</button><button disabled={filtered.length<9}>Next</button></div></div>
    </section>
    {selected&&draft&&<BookingDetail booking={editing?draft:selected} editing={editing} onChange={setDraft} onClose={closeBooking} onEdit={()=>setEditing(true)} onSave={saveBooking} onCancelEdit={()=>{setDraft(selected);setEditing(false)}} onCancelBooking={cancelBooking}/>}
  </div>
}

type NewBookingForm = {
  id:string; status:BookingStatus; bookingDate:string; customerName:string; contactPerson:string;
  email:string; phone:string; ship:string; cruiseLine:string; port:string; tour:string;
  tourDate:string; startTime:string; endTime:string; guests:string; vehicle:string;
  driver:string; guide:string; pickupLocation:string; meetingInstructions:string;
  price:string; currency:string; paymentStatus:string; notes:string
}

const bookingOptions = {
  ships:['Viking Neptune','Viking Mars','Celebrity Silhouette','Rotterdam','Regal Princess','Costa Favolosa'],
  tours:['Nature & Wildlife RIB Safari','Stuðlagil Canyon Adventure','Eastfjords Private Explorer','Vök Baths & Highland Circle','Seyðisfjörður Scenic Tour'],
  vehicles:['Unassigned','GE-01 · Defender','GE-02 · Transit','GE-03 · Sprinter','GE-04 · Transit','GE-05 · Land Cruiser','GE-06 · Crafter','GE-07 · Sprinter','GE-08 · Sprinter'],
  drivers:['Unassigned','Árni Pálsson','Hrafn Eiríksson','Jón Einarsson','Magnús Þórsson','Sara Björnsdóttir','Bjarni Karlsson'],
  guides:['Unassigned','Sara Jónsdóttir','Elín Róbertsdóttir','Anna María Helgadóttir','Katrín Ólafsdóttir','Þóra Guðmundsdóttir','Jón Einarsson'],
}

function NewBookingPage({onSave,onCancel,existingCount}:{onSave:(booking:Booking)=>void;onCancel:()=>void;existingCount:number}){
  const [form,setForm]=useState<NewBookingForm>({
    id:`GE-260924-${String(existingCount+1).padStart(2,'0')}`,status:'Confirmed',bookingDate:'2026-09-24',customerName:'',contactPerson:'',email:'',phone:'',ship:'Viking Neptune',cruiseLine:'Viking Ocean Cruises',port:'Seyðisfjörður harbour',tour:'',tourDate:'2026-09-24',startTime:'',endTime:'',guests:'1',vehicle:'Unassigned',driver:'Unassigned',guide:'Unassigned',pickupLocation:'Cruise terminal',meetingInstructions:'',price:'0',currency:'ISK',paymentStatus:'Not invoiced',notes:''
  })
  const [errors,setErrors]=useState<Record<string,string>>({})
  const set=(key:keyof NewBookingForm)=>(value:string)=>{setForm(current=>({...current,[key]:value}));setErrors(current=>({...current,[key]:''}))}
  const validate=()=>{
    const next:Record<string,string>={}
    if(!form.customerName.trim())next.customerName='Customer name is required'
    if(!form.bookingDate)next.bookingDate='Booking date is required'
    if(!form.tour)next.tour='Tour is required'
    if(!form.tourDate)next.tourDate='Tour date is required'
    if(!form.startTime)next.startTime='Start time is required'
    if(Number(form.guests)<1)next.guests='At least one guest is required'
    if(Number(form.price)<0)next.price='Price cannot be negative'
    setErrors(next)
    return Object.keys(next).length===0
  }
  const submit=(asInquiry=false)=>{
    if(!validate())return
    const displayName=form.customerName.trim()
    const initials=(form.contactPerson||displayName).split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()
    const date=scheduleDate(form.tourDate)
    const amount=Number(form.price).toLocaleString('en-US',{maximumFractionDigits:0})
    onSave({id:form.id,customer:displayName,contactPerson:form.contactPerson,initials,email:form.email,phone:form.phone,country:'—',bookingDate:form.bookingDate,date,time:form.startTime,endTime:form.endTime,ship:form.ship,cruiseLine:form.cruiseLine,port:form.port,tour:form.tour,guests:Number(form.guests),vehicle:form.vehicle,driver:form.driver,guide:form.guide,pickupLocation:form.pickupLocation,meetingInstructions:form.meetingInstructions,price:`${form.currency} ${amount}`,currency:form.currency,paymentStatus:form.paymentStatus,status:asInquiry?'Inquiry':form.status,source:'Manual',notes:form.notes,accent:'#b59662'})
  }
  return <div className="page new-booking-page">
    <div className="form-page-heading"><button className="back-button" onClick={onCancel}><span>‹</span> Back to bookings</button><div className="page-heading"><div><p className="eyebrow">BOOKINGS</p><h1>New booking</h1><p>Create a reservation and assign the operational details.</p></div></div></div>
    {Object.values(errors).some(Boolean)&&<div className="validation-banner"><strong>Some required information is missing.</strong><span>Review the highlighted fields before saving.</span></div>}
    <form className="booking-form" onSubmit={e=>{e.preventDefault();submit()}} noValidate>
      <FormSection title="Booking information" description="Reference and current booking state."><FormGrid><FormField label="Booking number"><input value={form.id} onChange={e=>set('id')(e.target.value)}/></FormField><FormField label="Booking status"><select value={form.status} onChange={e=>set('status')(e.target.value)}><option>Inquiry</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select></FormField><FormField label="Booking date" required error={errors.bookingDate}><input className={errors.bookingDate?'invalid':''} type="date" value={form.bookingDate} onChange={e=>set('bookingDate')(e.target.value)}/></FormField></FormGrid></FormSection>
      <FormSection title="Customer" description="Primary company and contact information."><FormGrid><FormField label="Customer / company name" required error={errors.customerName}><input className={errors.customerName?'invalid':''} value={form.customerName} onChange={e=>set('customerName')(e.target.value)}/></FormField><FormField label="Contact person"><input value={form.contactPerson} onChange={e=>set('contactPerson')(e.target.value)}/></FormField><FormField label="Email"><input type="email" value={form.email} onChange={e=>set('email')(e.target.value)}/></FormField><FormField label="Phone"><input type="tel" value={form.phone} onChange={e=>set('phone')(e.target.value)}/></FormField></FormGrid></FormSection>
      <FormSection title="Cruise / ship information" description="Arrival context and departure point."><FormGrid><FormField label="Ship"><select value={form.ship} onChange={e=>set('ship')(e.target.value)}>{bookingOptions.ships.map(option=><option key={option}>{option}</option>)}</select></FormField><FormField label="Cruise line"><input value={form.cruiseLine} onChange={e=>set('cruiseLine')(e.target.value)}/></FormField><FormField label="Port / departure location" wide><input value={form.port} onChange={e=>set('port')(e.target.value)}/></FormField></FormGrid></FormSection>
      <FormSection title="Tour" description="Scheduled service and guest count."><FormGrid><FormField label="Tour" required error={errors.tour} wide><select className={errors.tour?'invalid':''} value={form.tour} onChange={e=>set('tour')(e.target.value)}><option value="">Select a tour</option>{bookingOptions.tours.map(option=><option key={option}>{option}</option>)}</select></FormField><FormField label="Tour date" required error={errors.tourDate}><input className={errors.tourDate?'invalid':''} type="date" value={form.tourDate} onChange={e=>set('tourDate')(e.target.value)}/></FormField><FormField label="Start time" required error={errors.startTime}><input className={errors.startTime?'invalid':''} type="time" value={form.startTime} onChange={e=>set('startTime')(e.target.value)}/></FormField><FormField label="End time" hint="Optional"><input type="time" value={form.endTime} onChange={e=>set('endTime')(e.target.value)}/></FormField><FormField label="Number of guests" required error={errors.guests}><input className={errors.guests?'invalid':''} type="number" min="1" value={form.guests} onChange={e=>set('guests')(e.target.value)}/></FormField></FormGrid></FormSection>
      <FormSection title="Operations" description="Resource assignments and meeting details."><FormGrid><FormField label="Vehicle"><select value={form.vehicle} onChange={e=>set('vehicle')(e.target.value)}>{bookingOptions.vehicles.map(option=><option key={option}>{option}</option>)}</select></FormField><FormField label="Driver"><select value={form.driver} onChange={e=>set('driver')(e.target.value)}>{bookingOptions.drivers.map(option=><option key={option}>{option}</option>)}</select></FormField><FormField label="Guide"><select value={form.guide} onChange={e=>set('guide')(e.target.value)}>{bookingOptions.guides.map(option=><option key={option}>{option}</option>)}</select></FormField><FormField label="Pickup location"><input value={form.pickupLocation} onChange={e=>set('pickupLocation')(e.target.value)}/></FormField><FormField label="Meeting instructions" hint="Optional" wide><textarea value={form.meetingInstructions} onChange={e=>set('meetingInstructions')(e.target.value)} placeholder="Signage, berth, or guest-specific instructions"/></FormField></FormGrid></FormSection>
      <FormSection title="Financial" description="Price and invoicing state."><FormGrid><FormField label="Price" error={errors.price}><input className={errors.price?'invalid':''} type="number" min="0" value={form.price} onChange={e=>set('price')(e.target.value)}/></FormField><FormField label="Currency"><select value={form.currency} onChange={e=>set('currency')(e.target.value)}><option>ISK</option><option>EUR</option><option>USD</option></select></FormField><FormField label="Payment / invoice status"><select value={form.paymentStatus} onChange={e=>set('paymentStatus')(e.target.value)}><option>Not invoiced</option><option>Invoice sent</option><option>Partially paid</option><option>Paid</option><option>Refunded</option></select></FormField></FormGrid></FormSection>
      <FormSection title="Additional information" description="Visible to the internal operations team only."><FormGrid><FormField label="Internal notes" wide><textarea value={form.notes} onChange={e=>set('notes')(e.target.value)} placeholder="Accessibility, dietary, timing, or supplier notes"/></FormField></FormGrid></FormSection>
      <div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button><div><button type="button" className="inquiry-button" onClick={()=>submit(true)}>Save as inquiry</button><button type="submit" className="primary-button">Save booking</button></div></div>
    </form>
  </div>
}

function FormSection({title,description,children}:{title:string;description:string;children:React.ReactNode}){return <section className="form-section panel"><div className="form-section-heading"><h2>{title}</h2><p>{description}</p></div><div className="form-section-fields">{children}</div></section>}
function FormGrid({children}:{children:React.ReactNode}){return <div className="form-grid">{children}</div>}
function FormField({label,required=false,hint,error,wide=false,children}:{label:string;required?:boolean;hint?:string;error?:string;wide?:boolean;children:React.ReactNode}){return <label className={`form-field ${wide?'wide':''}`}><span>{label}{required&&<b>*</b>}{hint&&<small>{hint}</small>}</span>{children}{error&&<em>{error}</em>}</label>}

function Filter({label,value,onChange,options,all}:{label:string;value:string;onChange:(v:string)=>void;options:string[];all:string}){return <label className="filter-control"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}><option>{all}</option>{options.map(option=><option key={option}>{option}</option>)}</select></label>}

function BookingDetail({booking,editing,onChange,onClose,onEdit,onSave,onCancelEdit,onCancelBooking}:{booking:Booking;editing:boolean;onChange:(b:Booking)=>void;onClose:()=>void;onEdit:()=>void;onSave:()=>void;onCancelEdit:()=>void;onCancelBooking:()=>void}){
  const field=(key:keyof Booking)=>(value:string)=>onChange({...booking,[key]:key==='guests'?Number(value):value})
  return <><button className="detail-scrim" aria-label="Close booking details" onClick={onClose}/><aside className="booking-detail" aria-label={`Booking ${booking.id} details`}>
    <div className="detail-header"><div><p className="eyebrow">BOOKING DETAILS</p><h2>{booking.id}</h2><p>Created via {booking.source}</p></div><button className="detail-close" onClick={onClose} aria-label="Close details"><Icon name="close"/></button></div>
    <div className="detail-status-row"><Status status={booking.status}/><span>{booking.date} · {booking.time}</span></div>
    <div className="detail-body">
      <DetailSection title="Booking information"><DetailField label="Tour" value={booking.tour} editing={editing} onChange={field('tour')}/><div className="detail-columns"><DetailField label="Date" value={booking.date} editing={editing} onChange={field('date')}/><DetailField label="Pickup / start" value={booking.time} editing={editing} onChange={field('time')}/></div><div className="detail-columns"><DetailField label="Guests" value={String(booking.guests)} editing={editing} type="number" onChange={field('guests')}/><DetailField label="Price" value={booking.price} editing={editing} onChange={field('price')}/></div></DetailSection>
      <DetailSection title="Customer"><div className="detail-customer"><span className="guest-avatar large" style={{'--avatar':booking.accent} as React.CSSProperties}>{booking.initials}</span><div><strong>{booking.customer}</strong><small>{booking.country}</small></div></div><DetailField label="Email" value={booking.email} editing={editing} onChange={field('email')}/><DetailField label="Phone" value={booking.phone} editing={editing} onChange={field('phone')}/></DetailSection>
      <DetailSection title="Ship & assignments"><DetailField label="Ship" value={booking.ship} meta={booking.cruiseLine} editing={editing} onChange={field('ship')}/><DetailField label="Vehicle" value={booking.vehicle} editing={editing} onChange={field('vehicle')}/><div className="detail-columns"><DetailField label="Driver" value={booking.driver} editing={editing} onChange={field('driver')}/><DetailField label="Guide" value={booking.guide} editing={editing} onChange={field('guide')}/></div></DetailSection>
      <DetailSection title="Operational notes"><DetailField label="Notes" value={booking.notes} editing={editing} multiline onChange={field('notes')}/></DetailSection>
      {editing&&<DetailSection title="Booking status"><label className="detail-field"><span>Status</span><select value={booking.status} onChange={e=>field('status')(e.target.value)}><option>Inquiry</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select></label></DetailSection>}
    </div>
    <div className="detail-actions">{editing?<><button className="secondary-button" onClick={onCancelEdit}>Discard</button><button className="primary-button" onClick={onSave}>Save changes</button></>:<><button className="danger-button" onClick={onCancelBooking} disabled={booking.status==='Cancelled'}>{booking.status==='Cancelled'?'Booking cancelled':'Cancel booking'}</button><button className="secondary-button edit-button" onClick={onEdit}>Edit booking</button></>}</div>
  </aside></>
}
function DetailSection({title,children}:{title:string;children:React.ReactNode}){return <section className="detail-section"><h3>{title}</h3>{children}</section>}
function DetailField({label,value,meta,editing,onChange,type='text',multiline=false}:{label:string;value:string;meta?:string;editing:boolean;onChange:(v:string)=>void;type?:string;multiline?:boolean}){return <label className="detail-field"><span>{label}</span>{editing?(multiline?<textarea value={value} onChange={e=>onChange(e.target.value)}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)}/>):<div><strong>{value}</strong>{meta&&<small>{meta}</small>}</div>}</label>}

function BookingTable({data,compact=false,onSelect}:{data:Booking[];compact?:boolean;onSelect?:(booking:Booking)=>void}){return <div className="table-scroll"><table className={compact?'compact':'bookings-table'}><thead><tr>{compact?<><th>CUSTOMER</th><th>TOUR</th><th>DATE & TIME</th><th>GUESTS</th><th>STATUS</th></>:<><th>BOOKING</th><th>DATE / START</th><th>SHIP / CRUISE LINE</th><th>TOUR</th><th>CUSTOMER</th><th>GUESTS</th><th>VEHICLE</th><th>DRIVER</th><th>PRICE</th><th>STATUS</th></>}<th><span className="sr-only">Open</span></th></tr></thead><tbody>{data.map(b=><tr key={b.id} className={onSelect?'clickable-row':''} onClick={()=>onSelect?.(b)}>{compact?<><td><div className="guest-cell"><span className="guest-avatar" style={{'--avatar':b.accent} as React.CSSProperties}>{b.initials}</span><span><strong>{b.customer}</strong><small>{b.id} · {b.country}</small></span></div></td><td><strong className="tour-name">{b.tour}</strong><small className="source">via {b.source}</small></td><td><strong>{b.date}</strong><small>{b.time}</small></td><td><span className="guest-count"><Icon name="people" size={15}/>{b.guests}</span></td><td><Status status={b.status}/></td></>:<><td><strong className="booking-id">{b.id}</strong><small>{b.source}</small></td><td><strong>{b.date}</strong><small>{b.time}</small></td><td><strong>{b.ship}</strong><small>{b.cruiseLine}</small></td><td><strong className="tour-name">{b.tour}</strong></td><td><div className="guest-cell"><span className="guest-avatar" style={{'--avatar':b.accent} as React.CSSProperties}>{b.initials}</span><span><strong>{b.customer}</strong><small>{b.country}</small></span></div></td><td><span className="guest-count"><Icon name="people" size={15}/>{b.guests}</span></td><td><strong>{b.vehicle}</strong></td><td><strong>{b.driver}</strong></td><td><strong>{b.price}</strong></td><td><Status status={b.status}/></td></>}<td><button className="row-arrow" onClick={e=>{e.stopPropagation();onSelect?.(b)}} aria-label={`Open booking ${b.id}`}><Icon name="arrow" size={16}/></button></td></tr>)}{!data.length&&<tr><td colSpan={11} className="empty-state">No bookings match your filters.</td></tr>}</tbody></table></div>}
export default App
