/**
 * Standardized API Response Helper
 * Ensures all API responses follow the Envelope Pattern:
 * { status: "success"|"error", message: "...", data: {...} }
 */

export const sendSuccess = (res, data = null, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

export const sendError = (res, message = "Internal Server Error", statusCode = 500, details = null) => {
  const response = {
    status: "error",
    message,
  };
  if (details) response.details = details;
  return res.status(statusCode).json(response);
};
