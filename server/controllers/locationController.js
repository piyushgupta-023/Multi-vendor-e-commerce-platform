const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.lookupPincode = async (req, res) => {
  const { pincode } = req.params;

  if (!/^\d{6}$/.test(pincode)) {
    return sendError(res, 400, 'Enter a valid 6-digit Indian PIN code.');
  }

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return sendError(res, 502, 'Postal lookup is temporarily unavailable. Please try again.');
    }

    const [result] = await response.json();
    const postOffice = result?.Status === 'Success' ? result.PostOffice?.[0] : null;

    if (!postOffice) {
      return sendError(res, 404, 'No delivery location was found for this PIN code.');
    }

    return sendSuccess(res, 200, 'Delivery location found', {
      pincode,
      officeName: postOffice.Name,
      district: postOffice.District,
      state: postOffice.State,
    });
  } catch (error) {
    const message = error.name === 'TimeoutError'
      ? 'Postal lookup timed out. Please try again.'
      : 'Unable to verify this PIN code right now. Please try again.';
    return sendError(res, 502, message);
  }
};
