export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[0-9+\-\s()]{8,20}$/;
export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

export const isAdultDate = (dateString) => {
  if (!dateString) return false;
  const dob = new Date(dateString);
  if (Number.isNaN(dob.getTime())) return false;
  const now = new Date();
  const cutoff = new Date(
    now.getFullYear() - 12,
    now.getMonth(),
    now.getDate(),
  );
  return dob <= cutoff;
};
