
 const hash = (password) => {
	return bcrypt.hash(password, 10);
 }

 const comparePassword = (oldPassword, newPassword) => {
	 return bcrypt.compare(oldPassword, newPassword);
  };

  module.exports = { hash, comparePassword };
  