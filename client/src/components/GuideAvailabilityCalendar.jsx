import { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const GuideAvailabilityCalendar = ({ availability = {} }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const renderHeader = () => {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return (
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                        className="p-3 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-900"
                    >
                        <FaChevronLeft />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                        className="p-3 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-900"
                    >
                        <FaChevronRight />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 mb-4">
                {days.map(day => (
                    <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const numDays = daysInMonth(year, month);
        const firstDay = firstDayOfMonth(year, month);
        const cells = [];

        // Padding for start of month
        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className="h-12"></div>);
        }

        for (let d = 1; d <= numDays; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const available = availability[dateStr];
            const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

            cells.push(
                <div key={d} className="relative flex flex-col items-center justify-center h-14 group">
                    <span className={`text-sm font-bold transition duration-300 ${isToday ? 'text-red-600' : 'text-slate-600'}`}>
                        {d}
                    </span>
                    {available !== undefined && (
                        <div className={`mt-1 h-1.5 w-1.5 rounded-full ${available ? 'bg-green-500' : 'bg-red-400'}`}></div>
                    )}
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20 pointer-events-none font-bold uppercase tracking-tighter">
                        {available === true ? 'Booking Available' : available === false ? 'Fully Booked' : 'Schedule Pending'}
                    </div>
                </div>
            );
        }

        return <div className="grid grid-cols-7 gap-1">{cells}</div>;
    };

    return (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
            <div className="mt-8 flex gap-6 justify-center border-t border-slate-50 pt-6">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Open</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-400"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Booked</span>
                </div>
            </div>
        </div>
    );
};

export default GuideAvailabilityCalendar;
