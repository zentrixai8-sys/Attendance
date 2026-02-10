import React, { useState, useEffect } from 'react';

const Report = () => {
  const [activeTab, setActiveTab] = useState('Visit');
  const [visitData, setVisitData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [travellingData, setTravellingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [visitFilter, setVisitFilter] = useState({ month: '', year: '' });
  const [attendanceFilter, setAttendanceFilter] = useState({ month: '', year: '' });
  const [travellingFilter, setTravellingFilter] = useState({ month: '', year: '' });
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState('');

  const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx2k73Y40yVytGHKfS0NMV5Ct72rgMkfD0JUj7ZKpYSr3PjZeWnOrMR8Lr1bnvDDIUH/exec";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${APP_SCRIPT_URL}?action=getAllData`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setVisitData(data.visit || []);
        setAttendanceData(data.attendance || []);
        setTravellingData(data.travelling || []);
      } else {
        setError(data.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Error fetching data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate month/year options
  const getMonthYearOptions = (data, dateField) => {
    const uniqueDates = new Set();
    data.forEach(item => {
      if (item[dateField]) {
        const date = new Date(item[dateField]);
        if (!isNaN(date)) {
          uniqueDates.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
        }
      }
    });
    return Array.from(uniqueDates).sort().reverse();
  };

  // Filter data by month/year
  const filterDataByDate = (data, dateField, filter) => {
    if (!filter.month && !filter.year) return data;
    
    return data.filter(item => {
      if (!item[dateField]) return false;
      const date = new Date(item[dateField]);
      if (isNaN(date)) return false;
      
      const itemMonth = String(date.getMonth() + 1).padStart(2, '0');
      const itemYear = String(date.getFullYear());
      
      if (filter.year && filter.month) {
        return itemYear === filter.year && itemMonth === filter.month;
      } else if (filter.year) {
        return itemYear === filter.year;
      } else if (filter.month) {
        return itemMonth === filter.month;
      }
      return true;
    });
  };

  // Aggregate Visit data
  const getAggregatedVisitData = () => {
    const filtered = filterDataByDate(visitData, 'inTime', visitFilter);
    const grouped = {};
    
    filtered.forEach(item => {
      const name = item.personName;
      if (!grouped[name]) {
        grouped[name] = {
          personName: name,
          totalRunning: 0,
          inVehicleAmount: 0,
          outVehicleAmount: 0,
          count: 0,
          details: []
        };
      }
      grouped[name].totalRunning += parseFloat(item.totalRunning) || 0;
      grouped[name].inVehicleAmount += parseFloat(item.inVehicleAmount) || 0;
      grouped[name].outVehicleAmount += parseFloat(item.outVehicleAmount) || 0;
      grouped[name].count += 1;
      grouped[name].details.push(item);
    });
    
    return Object.values(grouped);
  };

  // Aggregate Attendance data
  const getAggregatedAttendanceData = () => {
    const filtered = filterDataByDate(attendanceData, 'dateTime', attendanceFilter);
    const grouped = {};
    
    filtered.forEach(item => {
      const name = item.personName;
      if (!grouped[name]) {
        grouped[name] = {
          personName: name,
          count: 0,
          details: []
        };
      }
      grouped[name].count += 1;
      grouped[name].details.push(item);
    });
    
    return Object.values(grouped);
  };

  // Aggregate Travelling data
  const getAggregatedTravellingData = () => {
    const filtered = filterDataByDate(travellingData, 'dateTime', travellingFilter);
    const grouped = {};
    
    filtered.forEach(item => {
      const name = item.personName;
      if (!grouped[name]) {
        grouped[name] = {
          personName: name,
          stayDay: 0,
          advanceAmount: 0,
          count: 0,
          details: []
        };
      }
      grouped[name].stayDay += parseFloat(item.stayDay) || 0;
      grouped[name].advanceAmount += parseFloat(item.advanceAmount) || 0;
      grouped[name].count += 1;
      grouped[name].details.push(item);
    });
    
    return Object.values(grouped);
  };

  // Function to format date and time to "dd/mm/yyyy hh:mm:ss"
const formatDateTime = (dateValue) => {
  if (!dateValue) return '';
  
  const date = new Date(dateValue);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return dateValue;
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};


  const openModal = (title, details, type) => {
    setModalTitle(title);
    setModalData(details);
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalData([]);
    setModalTitle('');
    setModalType('');
  };

  const renderVisitTable = () => {
    const aggregatedData = getAggregatedVisitData();
    const monthYearOptions = getMonthYearOptions(visitData, 'inTime');
    const totalPersons = aggregatedData.length;
    
    return (
      <div>
        {/* Filters */}
        <div className="mb-4 flex gap-4 items-center bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month/Year</label>
            <select
              value={visitFilter.month && visitFilter.year ? `${visitFilter.year}-${visitFilter.month}` : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const [year, month] = e.target.value.split('-');
                  setVisitFilter({ month, year });
                } else {
                  setVisitFilter({ month: '', year: '' });
                }
              }}
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {monthYearOptions.map(opt => {
                const [year, month] = opt.split('-');
                const date = new Date(year, month - 1);
                return (
                  <option key={opt} value={opt}>
                    {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-blue-600 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left">Person Name</th>
                  <th className="px-4 py-3 text-left">Total Running (Km)</th>
                  <th className="px-4 py-3 text-left">In Vehicle Amount</th>
                  <th className="px-4 py-3 text-left">Out Vehicle Amount</th>
                  <th className="px-4 py-3 text-left">Total Visit</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedData.length > 0 ? (
                  aggregatedData.slice(1).map((row, index) => (
                    <tr 
                      key={index} 
                      className={`cursor-pointer hover:bg-blue-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                      onClick={() => openModal(`Visit Details - ${row.personName}`, row.details, 'visit')}
                    >
                      <td className="px-4 py-3 border-t">{row.personName}</td>
                      <td className="px-4 py-3 border-t">{row.totalRunning.toFixed(2)}</td>
                      <td className="px-4 py-3 border-t">{row.inVehicleAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 border-t">{row.outVehicleAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 border-t font-semibold">{row.count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-700 font-medium">
          Total Unique Persons: {totalPersons}
        </div>
      </div>
    );
  };

  const renderAttendanceTable = () => {
    const aggregatedData = getAggregatedAttendanceData();
    const monthYearOptions = getMonthYearOptions(attendanceData, 'dateTime');
    const totalPersons = aggregatedData.length;
    
    return (
      <div>
        {/* Filters */}
        <div className="mb-4 flex gap-4 items-center bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month/Year</label>
            <select
              value={attendanceFilter.month && attendanceFilter.year ? `${attendanceFilter.year}-${attendanceFilter.month}` : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const [year, month] = e.target.value.split('-');
                  setAttendanceFilter({ month, year });
                } else {
                  setAttendanceFilter({ month: '', year: '' });
                }
              }}
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500"
            >
              <option value="">All</option>
              {monthYearOptions.map(opt => {
                const [year, month] = opt.split('-');
                const date = new Date(year, month - 1);
                return (
                  <option key={opt} value={opt}>
                    {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-green-600 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left">Person Name</th>
                  <th className="px-4 py-3 text-left">Total Attendance</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedData.length > 0 ? (
                  aggregatedData.map((row, index) => (
                    <tr 
                      key={index} 
                      className={`cursor-pointer hover:bg-green-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                      onClick={() => openModal(`Attendance Details - ${row.personName}`, row.details, 'attendance')}
                    >
                      <td className="px-4 py-3 border-t">{row.personName}</td>
                      <td className="px-4 py-3 border-t font-semibold">{row.count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="px-4 py-8 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-700 font-medium">
          Total Unique Persons: {totalPersons}
        </div>
      </div>
    );
  };

  const renderTravellingTable = () => {
    const aggregatedData = getAggregatedTravellingData();
    const monthYearOptions = getMonthYearOptions(travellingData, 'dateTime');
    const totalPersons = aggregatedData.length;
    
    return (
      <div>
        {/* Filters */}
        <div className="mb-4 flex gap-4 items-center bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month/Year</label>
            <select
              value={travellingFilter.month && travellingFilter.year ? `${travellingFilter.year}-${travellingFilter.month}` : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const [year, month] = e.target.value.split('-');
                  setTravellingFilter({ month, year });
                } else {
                  setTravellingFilter({ month: '', year: '' });
                }
              }}
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All</option>
              {monthYearOptions.map(opt => {
                const [year, month] = opt.split('-');
                const date = new Date(year, month - 1);
                return (
                  <option key={opt} value={opt}>
                    {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-purple-600 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left">Person Name</th>
                  <th className="px-4 py-3 text-left">Total Stay Days</th>
                  <th className="px-4 py-3 text-left">Total Advance Amount</th>
                  <th className="px-4 py-3 text-left">Total Travelling</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedData.length > 0 ? (
                  aggregatedData.map((row, index) => (
                    <tr 
                      key={index} 
                      className={`cursor-pointer hover:bg-purple-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                      onClick={() => openModal(`Travelling Details - ${row.personName}`, row.details, 'travelling')}
                    >
                      <td className="px-4 py-3 border-t">{row.personName}</td>
                      <td className="px-4 py-3 border-t">{row.stayDay.toFixed(0)}</td>
                      <td className="px-4 py-3 border-t">{row.advanceAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 border-t font-semibold">{row.count}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-700 font-medium">
          Total Unique Persons: {totalPersons}
        </div>
      </div>
    );
  };

  const renderModalContent = () => {

    if (modalType === 'visit') {
      return (
        <div className="overflow-x-auto">
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-blue-600 text-white sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm">Person Name</th>
                  <th className="px-4 py-2 text-left text-sm">In Time</th>
                  <th className="px-4 py-2 text-left text-sm">Out Time</th>
                  <th className="px-4 py-2 text-left text-sm">From</th>
                  <th className="px-4 py-2 text-left text-sm">To</th>
                  <th className="px-4 py-2 text-left text-sm">Total Running (Km)</th>
                  <th className="px-4 py-2 text-left text-sm">In Vehicle Amount</th>
                  <th className="px-4 py-2 text-left text-sm">Out Vehicle Amount</th>
                </tr>
              </thead>
              <tbody>
                {modalData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-2 border-t text-sm">{row.personName}</td>
                    <td className="px-4 py-2 border-t text-sm">{formatDateTime(row.inTime)}</td>
                    <td className="px-4 py-2 border-t text-sm">{formatDateTime(row.outTime)}</td>

                    <td className="px-4 py-2 border-t text-sm">{row.from}</td>
                    <td className="px-4 py-2 border-t text-sm">{row.to}</td>

                    <td className="px-4 py-2 border-t text-sm">{row.totalRunning}</td>
                    <td className="px-4 py-2 border-t text-sm">{row.inVehicleAmount}</td>
                    <td className="px-4 py-2 border-t text-sm">{row.outVehicleAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (modalType === 'attendance') {
      return (
        <div className="overflow-x-auto">
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-green-600 text-white sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm">Person Name</th>
                  <th className="px-4 py-2 text-left text-sm">In Date</th>
                  <th className="px-4 py-2 text-left text-sm">Out Date</th>
                  <th className="px-4 py-2 text-left text-sm">Map Link</th>
                  <th className="px-4 py-2 text-left text-sm">Address</th>
                </tr>
              </thead>
              <tbody>
                {modalData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-2 border-t text-sm">{row.personName}</td>
                    <td className="px-4 py-2 border-t text-sm">{formatDateTime(row.inDate)}</td>
                    <td className="px-4 py-2 border-t text-sm">{formatDateTime(row.outDate)}</td>
                    <td className="px-4 py-2 border-t text-sm">
                      {row.mapLink ? (
                        <a href={row.mapLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Map
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-2 border-t text-sm">{row.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (modalType === 'travelling') {
      return (
        <div className="overflow-x-auto">
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-purple-600 text-white sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm">Person Name</th>
                  <th className="px-4 py-2 text-left text-sm">From Location</th>
                  <th className="px-4 py-2 text-left text-sm">To Location</th>
                  <th className="px-4 py-2 text-left text-sm">Vehicle Type</th>
                  <th className="px-4 py-2 text-left text-sm">Stay Day</th>
                  <th className="px-4 py-2 text-left text-sm">Advance Amount</th>
                  <th className="px-4 py-2 text-left text-sm">Stay Bill</th>
                  <th className="px-4 py-2 text-left text-sm">Food Bill</th>
                  <th className="px-4 py-2 text-left text-sm">Travel Receipt</th>
                </tr>
              </thead>
              <tbody>
                {modalData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-2 border-t text-sm">{row.personName}</td>
                    <td className="px-4 py-2 border-t text-sm">{row.fromLocation}</td>
                    <td className="px-4 py-2 border-t text-sm">{row.toLocation}</td>
                    <td className="px-4 py-2 border-t text-sm">{row.vehicleType}</td>
                    <td className="px-4 py-2 border-t text-sm">{row.stayDay}</td>
                    <td className="px-4 py-2 border-t text-sm">{row.advanceAmount}</td>
                    <td className="px-4 py-2 border-t text-sm">
                      {row.stayBillImage ? (
                        <a href={row.stayBillImage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-2 border-t text-sm">
                      {row.foodingBillImage ? (
                        <a href={row.foodingBillImage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-2 border-t text-sm">
                      {row.travelReceipt ? (
                        <a href={row.travelReceipt} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports Dashboard</h1>
        
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('Visit')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'Visit'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Visit
            </button>
            <button
              onClick={() => setActiveTab('Attendance')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'Attendance'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveTab('Travelling')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'Travelling'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
              }`}
            >
              Travelling
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
              <button
                onClick={fetchData}
                className="ml-4 text-sm underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'Visit' && renderVisitTable()}
              {activeTab === 'Attendance' && renderAttendanceTable()}
              {activeTab === 'Travelling' && renderTravellingTable()}
            </>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">{modalTitle}</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              {renderModalContent()}
            </div>
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={closeModal}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;