// Handle "Enter" key press
export const handleEnterKey = (e, callback) => {
  if (e.key === "Enter") {
    e.preventDefault();
    callback();
  }
};
