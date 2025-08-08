const AuthImagePattern = ({ title, imageUrl }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
      <div className="max-w-md text-center">
        <img
          src={imageUrl}
          alt="Authentication Illustration"
          className="w-full h-auto rounded-2xl mb-8 object-cover"
        />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
    </div>
  );
};

export default AuthImagePattern;
