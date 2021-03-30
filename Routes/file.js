const xlsx = require("xlsx");
const path = require("path");

const exportExcel =  (data,columnName,workSheetName,filePath) =>{
    const workBook = xlsx.utils.book_new();
    const workSheetData = [
        columnName,
        ...data
    ];
    const workSheet = xlsx.utils.aoa_to_sheet(workSheetData);
    xlsx.utils.book_append_sheet(workBook,workSheet,workSheetName);
    xlsx.writeFile(workBook, path.resolve(filePath));
}

const exportData = (hasil,columnName,workSheetName,filePath) =>{
    const data = hasil.map(suhu =>{
        return [suhu.waktu,suhu.suhu1,suhu.suhu2,suhu.suhu3,suhu.suhu4];
    });

    exportExcel(data,columnName,workSheetName,filePath);
}

module.exports = exportData;