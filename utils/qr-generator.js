import QRCode from 'qrcode';

export const generateQRCode = async (text, options = {}) => {
  try {
    const defaultOptions = {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    };

    const qrCodeDataURL = await QRCode.toDataURL(text, defaultOptions);
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const generateQRCodeBuffer = async (text, options = {}) => {
  try {
    const defaultOptions = {
      width: 200,
      margin: 1,
      ...options
    };

    const buffer = await QRCode.toBuffer(text, defaultOptions);
    return buffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw error;
  }
};

export const generateRoomQRCode = (roomId, baseUrl = '') => {
  const roomUrl = `${baseUrl}/room/${roomId}`;
  return generateQRCode(roomUrl);
};