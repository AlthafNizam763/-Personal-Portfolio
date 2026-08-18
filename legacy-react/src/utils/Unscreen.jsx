import React from 'react';
import './Unscreen.css';

const gifCount = 5;
const gifSrc = 'assets/cock.gif'; 

const Unscreen = () => {
  return (
    <>
      {Array.from({ length: gifCount }, (_, index) => (
        <img
          key={index}
          src={gifSrc}
          alt={`Flying gif ${index + 1}`}
          className={`flying-gif direction-${index + 1}`}
        />
      ))}
    </>
  );
};

export default Unscreen;
