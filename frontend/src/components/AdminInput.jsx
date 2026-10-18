import PropTypes from 'prop-types';

const AdminInput = ({ label, ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-white mb-1">{label}</label>
    <input
      {...props}
      className="w-full px-4 py-2 rounded-md bg-white/10 text-white placeholder-white/70 border border-white/20 focus:outline-hidden focus:ring-2 focus:ring-pink-400 transition"
    />
  </div>
);

AdminInput.propTypes = {
  label: PropTypes.string.isRequired,
};

export default AdminInput;
