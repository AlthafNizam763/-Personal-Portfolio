import React from 'react';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="px-5 lg:px-28 flex justify-between flex-col lg:flex-row" id="about">
      <motion.div
        className="lg:w-1/2"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 10 }}
        viewport={{ once: true }}
      >
        <img src="assets/about-me.svg" alt="About Me Illustration" />
      </motion.div>

      <motion.div
        className="lg:w-1/2"
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 10, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <h2 className="lg:text-4xl text-2xl mt-4 lg:mt-0">
          About <span className="font-extrabold">Me</span>
        </h2>

        <p className="text-[#71717A] text-sm/6 lg:text-base mt-5 lg:mt-10 font-mono">
          I'm a passionate full-stack developer specializing in PHP and React.js. I enjoy turning ideas into efficient, user-focused applications by combining backend logic with sleek, responsive interfaces.
        </p>

        <p className="text-[#71717A] text-sm/6 lg:text-base mt-3 lg:mt-5 font-mono">
          My development journey began in 2024, and since then, I’ve been focused on growing my skills and contributing to real-world projects. I currently work at DOCME Cloud Solutions, building and maintaining modern web applications using PHP, MySQL, PostgreSQL, JavaScript, and modern frameworks.
        </p>

        <p className="text-[#71717A] text-sm/6 lg:text-base mt-3 lg:mt-5 font-mono">
          Outside of coding, I enjoy hitting the gym, diving into gaming, and relaxing with a good movie. I'm always eager to learn, connect, and take on new challenges in the tech world.
        </p>
      </motion.div>
    </div>
  );
}
