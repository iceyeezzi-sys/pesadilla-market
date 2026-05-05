const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

async function addTestUser() {
    try {
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        await sheet.addRow({
            Nombre: 'Tío Adam',
            Telefono: '59160710907',
            Estado: 'Pendiente'
        });

        console.log('✅ Tío Adam agregado con éxito a la base de datos.');
    } catch (error) {
        console.error('Error al agregar usuario:', error.message);
    }
}

addTestUser();
