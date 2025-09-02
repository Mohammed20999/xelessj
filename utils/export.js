import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename = 'export.xlsx', sheetName = 'Sheet1') => {
  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

export const exportMultipleSheets = (sheets, filename = 'export.xlsx') => {
  try {
    const wb = XLSX.utils.book_new();
    
    sheets.forEach(({ data, name }) => {
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, name);
    });
    
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Error exporting multiple sheets:', error);
    throw error;
  }
};

export const formatCleaningLogsForExport = (logs) => {
  return logs.map(log => ({
    'Date': new Date(log.timestamp).toLocaleDateString(),
    'Time': new Date(log.timestamp).toLocaleTimeString(),
    'Building': log.rooms?.locations?.building_name || '',
    'Room Number': log.rooms?.room_number || '',
    'Staff Email': log.users?.email || '',
    'Staff Name': log.users?.name || '',
    'Status': log.status,
    'Timestamp': log.timestamp
  }));
};

export const formatProblemReportsForExport = (reports) => {
  return reports.map(report => ({
    'Date': new Date(report.timestamp).toLocaleDateString(),
    'Time': new Date(report.timestamp).toLocaleTimeString(),
    'Building': report.rooms?.locations?.building_name || '',
    'Room Number': report.rooms?.room_number || '',
    'Client Email': report.users?.email || '',
    'Client Name': report.users?.name || '',
    'Description': report.description,
    'Status': report.status,
    'Timestamp': report.timestamp
  }));
};