
// COPY THIS ENTIRE CONTENT TO YOUR GOOGLE APPS SCRIPT PROJECT

function doGet(e) {
  try {
    if (!e) e = { parameter: {} };
    const action = e.parameter.action;

    if (action === "login") {
      const { username, password } = e.parameter;
      if (!username || !password) {
        return setCorsHeaders(ContentService.createTextOutput(
          JSON.stringify({ success: false, message: "Username and password are required" })
        ));
      }
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(authenticateUser(username, password))));
    }

    if (action === 'getAllData') {
      return getAllData();
    }

    if (action === "getFMSData") {
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(getFMSData())));
    }

    if (action === "getAllFMSData") {
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(getAllFMSData())));
    }

    return setCorsHeaders(ContentService.createTextOutput(
      JSON.stringify({ message: "Apps Script is working" })
    ));
  } catch (error) {
    Logger.log("Error in doGet: " + error.toString());
    return setCorsHeaders(ContentService.createTextOutput(
      JSON.stringify({ success: false, message: "Server error: " + error.toString() })
    ));
  }
}

function doPost(e) {
  try {
    let params = e.parameter;

    // Handle file upload
    if (params.action === "uploadFile") {
      const { fileName, fileData, mimeType = 'image/jpeg', folderId = "1QAxpUr5L4UMjgTpazbFj8lWzFvf_Y4Sz" } = params;

      if (!fileData || !fileName) {
        return setCorsHeaders(ContentService.createTextOutput(
          JSON.stringify({ success: false, error: "Missing file data or filename" })
        ));
      }

      const blob = Utilities.newBlob(Utilities.base64Decode(fileData), mimeType, fileName);
      const result = uploadFile(blob, fileName, folderId);

      if (result.success) {
        const cache = CacheService.getScriptCache();
        const fileInfo = { fileId: result.fileId, fileName: fileName, url: result.viewUrl, timestamp: new Date().getTime() };
        cache.put(fileName, JSON.stringify(fileInfo), 900);
      }

      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(result)));
    }

    // Handle serial number generation
    if (params.action === "generateSerialNumber") {
      return setCorsHeaders(ContentService.createTextOutput(
        JSON.stringify({ success: true, serialNumber: generateNextSerialNumber() })
      ));
    }

    // Handle get all FMS data
    if (params.action === "getAllFMSData") {
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(getAllFMSData())));
    }
    
    // START NEW CODE: Handle User Access Update AND Add User
    if (params.action === "updateUserAccess") {
      const { username, access } = params;
      if (!username) {
        return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({ success: false, error: "Username is required" })));
      }
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(updateUserAccess(username, access))));
    }

    if (params.action === "addUser") {
      const { name, username, password, role, access, employeeType, latitude, longitude, range } = params;
      if (!username || !password || !name) {
        return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({ success: false, error: "Name, Username and Password are required" })));
      }
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(addUser({ name, username, password, role, access, employeeType, latitude, longitude, range }))));
    }
    // END NEW CODE

    // Handle advance history
    if (params.action === "getAdvanceHistory") {
      Logger.log("📨 getAdvanceHistory request received");

      const personName = params.personName;
      Logger.log("👤 Person name parameter: " + personName);

      if (!personName || personName.trim() === "" || personName === "Unknown User") {
        Logger.log("❌ Invalid person name provided");
        return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: "Valid person name is required",
          data: [],
          count: 0
        })));
      }

      try {
        const result = getAdvanceHistory(personName.trim());
        Logger.log("✅ History fetched successfully, count: " + (result.data ? result.data.length : 0));
        return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(result)));
      } catch (error) {
        Logger.log("💥 Error in getAdvanceHistory: " + error.toString());
        return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: "Server error: " + error.toString(),
          data: [],
          count: 0
        })));
      }
    }
    
    // Handle advance submission
    if (params.action === "submitAdvance") {
      if (!params.rowData) {
        const errorResponse = { success: false, error: "Row data is required for advance submission" };
        return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(errorResponse)));
      }

      const rowData = JSON.parse(params.rowData);
      const result = submitAdvanceData(rowData);
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(result)));
    }

    // Handle advance status update
    if (params.action === "updateAdvanceStatus") {
      const rowNumber = parseInt(params.rowNumber);
      const status = params.status;
      const adminRemarks = params.adminRemarks || '';
      const serialNumber = params.serialNumber || '';
      const adminName = params.adminName || '';

      if (!rowNumber || !status) {
        return setCorsHeaders(ContentService.createTextOutput(
          JSON.stringify({ success: false, error: "Row number and status are required" })
        ));
      }

      try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Advance");
        if (!sheet) {
          return setCorsHeaders(ContentService.createTextOutput(
            JSON.stringify({ success: false, error: "Advance sheet not found" })
          ));
        }

        // Find the correct row by matching serial number
        let correctRow = -1;
        const data = sheet.getDataRange().getValues();

        for (let i = 1; i < data.length; i++) {
          const currentSerial = data[i][1]; // Column B
          if (currentSerial && currentSerial.toString().trim() === serialNumber.toString().trim()) {
            correctRow = i + 1;
            break;
          }
        }

        if (correctRow === -1) {
          return setCorsHeaders(ContentService.createTextOutput(
            JSON.stringify({ success: false, error: "Serial number " + serialNumber + " not found in sheet" })
          ));
        }

        const currentDateTime = formatDateTimeForSheet(new Date());

        sheet.getRange(correctRow, 13).setValue(currentDateTime); // Column M - Actual
        sheet.getRange(correctRow, 15).setValue(status); // Column O - Status  
        sheet.getRange(correctRow, 16).setValue(adminRemarks); // Column P - Remarks1
        sheet.getRange(correctRow, 17).setValue(adminName); // Column Q - Approved By

        return setCorsHeaders(ContentService.createTextOutput(
          JSON.stringify({
            success: true,
            message: "Status updated successfully for " + serialNumber + " by " + adminName
          })
        ));

      } catch (error) {
        return setCorsHeaders(ContentService.createTextOutput(
          JSON.stringify({ success: false, error: "Error updating status: " + error.toString() })
        ));
      }
    }

    // Handle general sheet operations (insert/updateOutData)
    const { sheetName, action = "insert" } = params;
    if (!sheetName) {
      // If we got here and didn't match previous actions, maybe it was a general sheet op request?
      // But verify we have a sheetName before calling it an error if it wasn't one of specific actions
       if (!["uploadFile", "generateSerialNumber", "getAllFMSData", "updateUserAccess", "getAdvanceHistory", "submitAdvance", "updateAdvanceStatus"].includes(params.action)) {
          const errorResponse = { success: false, error: "Sheet name is required" };
          return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(errorResponse)));
       }
       // If it was a specific action, we already returned.
    }
    
    if ( ["Attendance", "Travelling", "FMS", "OUT", "Advance"].includes(sheetName)) {

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
      if (!sheet) {
        const errorResponse = { success: false, error: `Sheet '${sheetName}' not found` };
        return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(errorResponse)));
      }

      let result = {};

      if (action === "insert") {
        if (!params.rowData) {
          const errorResponse = { success: false, error: "Row data is required for insert operation" };
          return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(errorResponse)));
        }

        const rowData = JSON.parse(params.rowData);

        if (sheetName === "Attendance") {
          if (rowData[1]) rowData[1] = formatDateTimeForSheet(rowData[1]);
          while (rowData.length < 10) rowData.push("");
          sheet.appendRow(rowData);
          result = { success: true, message: "Attendance recorded successfully" };
        }
        else if (sheetName === "Travelling") {
          if (rowData[7]) rowData[7] = formatDateForSheet(rowData[7]);
          if (rowData[14]) rowData[14] = formatDateForSheet(rowData[14]);
          const processedRowData = processFileLinksInRowData(rowData);
          while (processedRowData.length < 17) processedRowData.push("");
          sheet.appendRow(processedRowData);
          result = { success: true, message: "Travel information recorded successfully" };
        }
        else if (sheetName === "FMS") {
          if (rowData && Array.isArray(rowData)) {
            while (rowData.length < 21) rowData.push("");
            if (rowData.length > 21) rowData = rowData.slice(0, 21);
            if (rowData[9]) rowData[9] = formatDateForSheet(rowData[9]);

            const processedRowData = processFileLinksInRowData(rowData);

            try {
              const lastRow = sheet.getLastRow();
              const nextRow = lastRow + 1;
              const targetRange = sheet.getRange(nextRow, 1, 1, processedRowData.length);
              targetRange.setValues([processedRowData]);
              result = { success: true, message: "FMS travel information recorded successfully", rowNumber: nextRow };
            } catch (insertError) {
              sheet.appendRow(processedRowData);
              result = { success: true, message: "FMS travel information recorded successfully (appendRow method)" };
            }
          } else {
            result = { success: false, message: "Invalid data format received" };
          }
        }
        else if (sheetName === "Advance") {
          if (rowData && Array.isArray(rowData)) {
            while (rowData.length < 10) rowData.push("");
            if (rowData[4]) rowData[4] = formatDateForSheet(rowData[4]);
            if (rowData[5]) rowData[5] = formatDateForSheet(rowData[5]);
            if (rowData[0]) rowData[0] = formatDateTimeForSheet(rowData[0]);

            sheet.appendRow(rowData);
            result = { success: true, message: "Advance request submitted successfully" };
          } else {
            result = { success: false, message: "Invalid advance data format received" };
          }
        }
      }
      else if (action === "updateOutData") {
        if (e.postData && e.postData.type == 'application/x-www-form-urlencoded') {
          params = e.parameter;
        }

        const { serialNumber, rowData: rowDataString } = params;
        if (!serialNumber || !rowDataString) {
          result = { success: false, message: "Missing serial number or row data" };
        } else {
          try {
            const outData = JSON.parse(rowDataString);
            const values = sheet.getDataRange().getValues();
            let targetRowIndex = -1;

            for (let i = 1; i < values.length; i++) {
              const serialInSheet = values[i][1] ? values[i][1].toString().trim() : "";
              if (serialInSheet === serialNumber) {
                targetRowIndex = i + 1;
                break;
              }
            }

            if (targetRowIndex === -1) {
              result = { success: false, message: `Travel record with serial number ${serialNumber} not found` };
            } else {
              const processedOutData = processFileLinksInRowData(outData);

              const updates = [
                { col: 8, val: processedOutData[7] },
                { col: 13, val: processedOutData[12] },
                { col: 14, val: formatDateTimeForSheet(new Date()) },
                { col: 15, val: processedOutData[14] },
                { col: 16, val: formatDateForSheet(processedOutData[15]) },
                { col: 17, val: processedOutData[16] },
                { col: 18, val: processedOutData[17] },
                { col: 19, val: processedOutData[18] },
                { col: 20, val: processedOutData[19] },
                { col: 21, val: processedOutData[20] }
              ];

              updates.forEach(update => {
                if (update.val !== undefined && update.val !== "") {
                  sheet.getRange(targetRowIndex, update.col).setValue(update.val);
                }
              });

              result = { success: true, message: "OUT travel information updated successfully", rowNumber: targetRowIndex };
            }
          } catch (parseError) {
            result = { success: false, message: "Error parsing OUT data: " + parseError.toString() };
          }
        }
      }
      else {
         // Should have been handled above or is invalid
         // If generic default fallback needed:
         // result = { success: false, message: "Action not supported or sheet name invalid" }; 
      }
      return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(result)));
    } 

    return setCorsHeaders(ContentService.createTextOutput(
      JSON.stringify({ success: false, message: "Action not recognized" })
    ));

  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    const errorResponse = { success: false, error: error.toString() };
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(errorResponse)));
  }
}

// === NEW HELPER FUNCTION ===
function updateUserAccess(username, accessString) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
    if (!sheet) return { success: false, message: "Master sheet not found" };
    
    const data = sheet.getDataRange().getValues();
    // Assuming Row 1 is header, data starts at row 2 (index 1)
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] == username) { // Column B is username (index 1)
         // Column E is Access (index 4)
         // getRange(row, col) is 1-indexed. Row is i+1, Col is 5 (E)
         sheet.getRange(i + 1, 5).setValue(accessString);
         return { success: true, message: "Access updated successfully" };
      }
    }
    return { success: false, message: "User not found" };
  } catch (error) {
    return { success: false, message: "Error updating access: " + error.toString() };
  }
}
// ==========================

function addUser(userData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
    if (!sheet) return { success: false, message: "Master sheet not found" };

    const data = sheet.getDataRange().getValues();
    // Check if username already exists
    for (let i = 1; i < data.length; i++) {
        if (data[i][1] == userData.username) {
            return { success: false, message: "Username already exists" };
        }
    }

    // Append new user
    // Columns: Name, Username, Password, Role, Access, Employee Type, latitude, longitude, Range
    const newRow = [
        userData.name,
        userData.username,
        userData.password,
        userData.role || "user",
        userData.access || "all",
        userData.employeeType || "Out Of Office",
        userData.latitude || "",
        userData.longitude || "",
        userData.range || ""
    ];
    
    // Ensure we are appending to the next available row
    sheet.appendRow(newRow);
    
    return { success: true, message: "User added successfully" };

  } catch (error) {
    return { success: false, message: "Error adding user: " + error.toString() };
  }
}

function authenticateUser(username, password) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Master");
    if (!sheet) return { success: false, message: "Master sheet not found" };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: false, message: "No user data found in Master sheet" };

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const salesPersonName = row[0] ? row[0].toString().trim() : "";
      const sheetUsername = row[1] ? row[1].toString().trim() : "";
      const sheetPassword = row[2] ? row[2].toString().trim() : "";
      const userRole = row[3] ? row[3].toString().trim() : "user";
      const userAccess = row[4] ? row[4].toString().trim() : "";

      if (sheetUsername === username && sheetPassword === password) {
        return {
          success: true,
          message: "Login successful",
          user: {
            username: sheetUsername,
            salesPersonName: salesPersonName,
            role: userRole,
            access: userAccess,
            loginTime: new Date().toISOString()
          }
        };
      }
    }
    return { success: false, message: "Invalid username or password" };
  } catch (error) {
    Logger.log("Error in authenticateUser: " + error.toString());
    return { success: false, message: "Authentication error: " + error.toString() };
  }
}

function getAllData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get Visit Data from FMS sheet
    const visitData = getVisitData(ss);
    
    // Get Attendance Data from Attendance sheet
    const attendanceData = getAttendanceData(ss);
    
    // Get Travelling Data from Travelling sheet
    const travellingData = getTravellingData(ss);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      visit: visitData,
      attendance: attendanceData,
      travelling: travellingData
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getVisitData(ss) {
  const sheet = ss.getSheetByName('FMS');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  // Skip header row (index 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows
    if (!row[2]) continue; // Check if Person Name (Col C) exists
    
    result.push({
      personName: row[2] || '',        // Col C
      inTime: row[0] || '',             // Col A (for date filtering)
      from: row[3] || '',
      to: row[4] || '',
      outTime: row[13] || '',           // Col N (index 13)
      totalRunning: row[7] || '',       // Col H (index 7)
      inVehicleAmount: row[11] || '',   // Col L (index 11)
      outVehicleAmount: row[20] || ''   // Col U (index 20)
    });
  }
  
  return result;
}

function getAttendanceData(ss) {
  const sheet = ss.getSheetByName('Attendance');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  // Skip header row (index 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows
    if (!row[9]) continue; // Check if Person Name (Col J) exists
    
    const status = row[3]; // Col D - Status
    const dateTime = row[1]; // Col B - Date/Time
    
    // Create entry based on status
    if (status === 'IN' || status === 'OUT') {
      result.push({
        personName: row[9] || '',       // Col J (index 9)
        dateTime: row[0] || '',         // Col A (for date filtering)
        inDate: status === 'IN' ? dateTime : '',
        outDate: status === 'OUT' ? dateTime : '',
        mapLink: row[7] || '',          // Col H (index 7)
        address: row[8] || ''           // Col I (index 8)
      });
    }
  }
  
  return result;
}

function getTravellingData(ss) {
  const sheet = ss.getSheetByName('Travelling');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  // Skip header row (index 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows
    if (!row[1]) continue; // Check if Person Name (Col B) exists
    
    result.push({
      personName: row[1] || '',         // Col B (index 1)
      dateTime: row[0] || '',           // Col A (for date filtering)
      fromLocation: row[2] || '',       // Col C (index 2)
      toLocation: row[3] || '',         // Col D (index 3)
      vehicleType: row[4] || '',        // Col E (index 4)
      stayDay: row[5] || '',            // Col F (index 5)
      stayBillImage: row[8] || '',      // Col I (index 8)
      foodingBillImage: row[10] || '',  // Col K (index 10)
      travelReceipt: row[11] || '',     // Col L (index 11)
      advanceAmount: row[16] || ''      // Col Q (index 16)
    });
  }
  
  return result;
}

function generateNextSerialNumber() {
  // Implementation depending on your specific requirements
  // Placeholder as the user didn't provide this specific function in the last block
  return "MD-" + Date.now();
}

function generateUniqueFileId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < 33; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result + '_' + Date.now();
}

function setCorsHeaders(response) {
  return response
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE, PUT",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "3600"
    });
}

function doOptions(e) {
  return setCorsHeaders(ContentService.createTextOutput(""));
}

function formatDateForSheet(dateString) {
  try {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    Logger.log("Error formatting date: " + error.toString());
    return dateString;
  }
}

function formatDateTimeForSheet(dateTimeString) {
  try {
    if (!dateTimeString) return "";
    if (dateTimeString.includes("/") && dateTimeString.includes(":")) return dateTimeString;

    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return dateTimeString;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    Logger.log("Error formatting datetime: " + error.toString());
    return dateTimeString;
  }
}

function processFileLinksInRowData(rowData) {
  const cache = CacheService.getScriptCache();
  const processedData = [...rowData];

  for (let i = 0; i < processedData.length; i++) {
    const cellValue = processedData[i];

    if (typeof cellValue === 'string') {
      if (cellValue.includes(' | ')) {
        const fileLinks = cellValue.split(' | ');
        const processedLinks = fileLinks.map(link => processSingleFileLink(link.trim(), cache));
        processedData[i] = processedLinks.join(' | ');
      } else {
        processedData[i] = processSingleFileLink(cellValue, cache);
      }
    }
  }

  return processedData;
}

function processSingleFileLink(cellValue, cache) {
  if (typeof cellValue !== 'string') return cellValue;

  const filePatterns = [
    { pattern: 'in_vehicle_meter_', type: 'travel file' },
    { pattern: 'in_bus_ticket_', type: 'travel file' },
    { pattern: 'in_bill_receipt_', type: 'travel file' },
    { pattern: 'out_vehicle_meter_', type: 'travel file' },
    { pattern: 'out_bus_ticket_', type: 'travel file' },
    { pattern: 'out_bill_receipt_', type: 'travel file' },
    { pattern: 'STAY_BILL_', type: 'stay bill' },
    { pattern: 'TRAVEL_RECEIPT_', type: 'travel receipt' },
    { pattern: 'LOCAL_TRAVEL_RECEIPT_', type: 'local travel receipt' },
    { pattern: 'RETURN_TICKET_', type: 'return ticket' }
  ];

  for (const { pattern, type } of filePatterns) {
    if (cellValue.includes(pattern)) {
      const fileName = pattern.startsWith('STAY_') || pattern.startsWith('TRAVEL_') ||
        pattern.startsWith('LOCAL_') || pattern.startsWith('RETURN_')
        ? cellValue.replace(pattern, '') : cellValue;
      return processFileFromCache(fileName, cache, type);
    }
  }

  if (cellValue.includes('FOODING_BILL_')) {
    const placeholders = cellValue.split(',');
    const processedLinks = [];
    for (const placeholder of placeholders) {
      const trimmed = placeholder.trim();
      if (trimmed.startsWith('FOODING_BILL_')) {
        const fileName = trimmed.replace('FOODING_BILL_', '');
        processedLinks.push(processFileFromCache(fileName, cache, 'fooding bill'));
      } else {
        processedLinks.push(trimmed);
      }
    }
    return processedLinks.join(',');
  }

  return cellValue;
}

function processFileFromCache(fileName, cache, fileType) {
  const cachedFile = cache.get(fileName);
  if (cachedFile) {
    try {
      const fileInfo = JSON.parse(cachedFile);
      return fileInfo.url;
    } catch (parseError) {
      Logger.log(`Error parsing cached file info for ${fileName}: ${parseError.toString()}`);
    }
  }

  const uniqueFileId = generateUniqueFileId();
  return `https://drive.google.com/file/d/${uniqueFileId}/view?usp=drivesdk`;
}

function uploadFile(fileBlob, fileName, folderId) {
  try {
    let folder;
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (folderError) {
      throw new Error("Cannot access the specified folder. Please check folder ID and permissions.");
    }

    const existingFiles = folder.getFilesByName(fileName);
    while (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true);
    }

    const file = folder.createFile(fileBlob);

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      Logger.log("Sharing permission error: " + sharingError.toString());
    }

    const fileId = file.getId();
    const viewUrl = `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;

    const cache = CacheService.getScriptCache();
    const fileInfo = { fileId: fileId, fileName: fileName, url: viewUrl, timestamp: new Date().getTime() };
    cache.put(fileName, JSON.stringify(fileInfo), 1800);

    return {
      success: true,
      fileId: fileId,
      fileUrl: file.getUrl(),
      downloadUrl: `https://drive.google.com/uc?id=${fileId}`,
      viewUrl: viewUrl,
      fileName: fileName,
      message: "File uploaded successfully to Google Drive"
    };

  } catch (error) {
    Logger.log("Error uploading file to Drive: " + error.toString());
    return { success: false, error: "File upload failed: " + error.toString() };
  }
}

function generateNextAdvanceSerialNumber() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Advance");
    if (!sheet) return "AD-001";

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return "AD-001";

    let maxNumber = 0;
    for (let i = 1; i < data.length; i++) {
      const serialNumber = data[i][1]; // Column B
      if (serialNumber && typeof serialNumber === "string" && serialNumber.startsWith("AD-")) {
        const numPart = serialNumber.split("-")[1];
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNumber) maxNumber = num;
      }
    }
    return `AD-${(maxNumber + 1).toString().padStart(3, "0")}`;
  } catch (error) {
    Logger.log("Error generating advance serial number: " + error.toString());
    return "AD-001";
  }
}

function getFMSData() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("FMS");
    if (!sheet) return { success: false, message: "FMS sheet not found" };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };

    return {
      success: true,
      data: data.slice(1).map((row, index) => ({
        timestamp: row[0] || '',
        personName: row[2] || '',
        fromLocation: row[3] || '',
        toLocation: row[4] || '',
        vehicleType: row[5] || '',
        inMeterNumber: row[6] || '',
        outMeterNumber: row[7] || '',
        vehicleImages: row[8] || '',
        travelDate: formatDate(row[9]),
        remarks: row[10] || '',
        totalMeterNumber: row[11] || '',
        outImage: row[15] || '',
        originalIndex: index
      }))
    };
  } catch (error) {
    return { success: false, message: "Data fetch error" };
  }
}

function formatDate(dateValue) {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateValue.toString();
  }
}

function getAllFMSData() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("FMS");
    if (!sheet) return { success: false, message: "FMS sheet not found" };

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };

    const resultData = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      resultData.push({
        originalIndex: i + 1,
        timestamp: row[0] || '',
        serialNumber: row[1] || '',
        serialnumber: row[1] || '',
        personName: row[2] || '',
        fromLocation: row[3] || '',
        toLocation: row[4] || '',
        inVehicleType: row[5] || '',
        inMeterNumber: row[6] || '',
        totalRunningKm: row[7] || '',
        vehicleImages: row[8] || '',
        travelDate: row[9] || '',
        remarks: row[10] || '',
        inAmount: row[11] || '',
        outAmount: row[12] || '',
        currentDate: row[13] || '',
        returnDateFormatted: row[14] || '',
        returnDate: row[15] || '',
        outVehicleType: row[16] || '',
        outMeterNumber: row[17] || '',
        outImages: row[18] || '',
        outRemarks: row[19] || '',
        outTotalAmount: row[20] || ''
      });
    }

    return { success: true, data: resultData, totalCount: resultData.length };
  } catch (error) {
    Logger.log("Error in getAllFMSData: " + error.toString());
    return { success: false, message: "Data fetch error: " + error.toString(), data: [] };
  }
}

function submitAdvanceData(rowData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Advance");
    if (!sheet) {
      return { success: false, message: "Advance sheet not found" };
    }

    // Generate serial number
    const serialNumber = generateNextAdvanceSerialNumber();

    // Prepare data according to new column structure
    // A=Timestamp, B=Serial, C=Person, D=From, E=To, F=Start, G=End, H=Travel, I=Advance, J=Company, K=Remarks
    const formattedRowData = [
      formatDateTimeForSheet(new Date()), // Column A - Auto timestamp
      serialNumber, // Column B - Auto serial number
      rowData[1] || '', // Column C - Person Name
      rowData[2] || '', // Column D - From Location
      rowData[3] || '', // Column E - To Location
      formatDateForSheet(rowData[4]), // Column F - Start Date
      formatDateForSheet(rowData[5]), // Column G - End Date
      rowData[6] || '', // Column H - Travel Type
      rowData[7] || '', // Column I - Advance Amount
      rowData[8] || '', // Column J - Company Name
      rowData[9] || '' // Column K - Remarks
    ];

    sheet.appendRow(formattedRowData);

    return {
      success: true,
      message: "Advance request submitted successfully",
      serialNumber: serialNumber
    };
  } catch (error) {
    Logger.log("Error in submitAdvanceData: " + error.toString());
    return {
      success: false,
      message: "Error submitting advance data: " + error.toString()
    };
  }
}

function getAdvanceHistory(personName) {
  try {
    Logger.log("🔍 getAdvanceHistory called for: " + personName);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Advance");
    if (!sheet) {
      throw new Error("Advance sheet not found");
    }

    const data = sheet.getDataRange().getValues();
    Logger.log("📊 Total rows in sheet: " + data.length);

    if (data.length <= 1) {
      return {
        success: true,
        data: [],
        count: 0,
        message: "No advance requests found in sheet"
      };
    }

    const history = [];
    const searchName = personName.toLowerCase().trim();

    // Check if user is admin
    const isAdminUser = personName.toLowerCase() === 'admin' || searchName.includes('admin');

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip rows that don't have basic data
      if (!row[0] && !row[2]) continue;

      const rowPersonName = row[2] ? row[2].toString().trim().toLowerCase() : ""; // Column C
      const actual = row[12] || ''; // Column M - Actual (approval/rejection datetime)
      const status = row[14] || 'Pending'; // Column O - Status

      if (isAdminUser) {
        // Admin only sees requests WITHOUT actual value (neither approved nor rejected yet)
        if (!actual || actual === '') {
          const historyItem = {
            timestamp: row[0] || '',
            serialNumber: row[1] || '',
            salesPersonName: row[2] || '',
            fromLocation: row[3] || '',
            toLocation: row[4] || '',
            startDate: formatDateForDisplay(row[5]),
            endDate: formatDateForDisplay(row[6]),
            travelType: row[7] || '',
            advanceAmount: row[8] || '',
            companyName: row[9] || '',
            remarks: row[10] || '',
            actual: actual,
            status: status,
            adminRemarks: row[15] || '', // Column P
            originalIndex: i + 1,
            rowIndex: i
          };

          if (historyItem.fromLocation && historyItem.toLocation) {
            history.push(historyItem);
          }
        }
      } else if (rowPersonName === searchName) {
        // User sees their own requests (all of them)
        const historyItem = {
          timestamp: row[0] || '',
          serialNumber: row[1] || '',
          salesPersonName: row[2] || '',
          fromLocation: row[3] || '',
          toLocation: row[4] || '',
          startDate: formatDateForDisplay(row[5]),
          endDate: formatDateForDisplay(row[6]),
          travelType: row[7] || '',
          advanceAmount: row[8] || '',
          companyName: row[9] || '',
          remarks: row[10] || '',
          actual: actual,
          status: status,
          adminRemarks: row[15] || '', // Column P
          originalIndex: i + 1,
          rowIndex: i
        };

        if (historyItem.fromLocation && historyItem.toLocation) {
          history.push(historyItem);
        }
      }
    }

    Logger.log("✅ Found " + history.length + " matching records");

    // Sort by serial number in ASCENDING order (AD-001, AD-002, AD-003...)
    history.sort((a, b) => {
      const serialA = a.serialNumber || '';
      const serialB = b.serialNumber || '';

      // Extract numbers from serial (AD-001 -> 001)
      const numA = parseInt(serialA.split('-')[1] || '0');
      const numB = parseInt(serialB.split('-')[1] || '0');

      return numA - numB; // Ascending order
    });

    return {
      success: true,
      data: history, // Don't reverse, keep ascending order
      count: history.length,
      message: history.length > 0 ? `Found ${history.length} advance requests` : "No advance requests found"
    };

  } catch (error) {
    Logger.log("💥 Error in getAdvanceHistory: " + error.toString());
    throw error;
  }
}

function formatDateForDisplay(dateValue) {
  if (!dateValue) return '';
  try {
    if (typeof dateValue === 'string' && dateValue.includes('/')) {
      return dateValue; // Already formatted
    }
    const date = new Date(dateValue);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateValue.toString();
  }
}
