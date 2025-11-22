const ErrorAlert = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 ${className}`}>
      <p className="text-yellow-800">{message}</p>
    </div>
  );
};

export default ErrorAlert;

