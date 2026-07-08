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
        I'm a passionate <span className="font-semibold">Full Stack Developer</span> with 2 years of experience building scalable, secure, and user-centric web applications. I specialize in <span className="font-semibold">Laravel, CodeIgniter, Node.js, React.js, and Next.js</span>, creating robust backend systems and modern, responsive user interfaces.
      </p>

      <p className="text-[#71717A] text-sm/6 lg:text-base mt-3 lg:mt-5 font-mono">
        Currently, I work at <span className="font-semibold">DOCME Cloud Solutions</span>, where I contribute to enterprise-grade HRMS solutions by developing RESTful APIs, backend services, and scalable web applications using <span className="font-semibold">PHP, MySQL, PostgreSQL, MongoDB, JavaScript, and TypeScript</span>. I'm passionate about writing clean, maintainable code and delivering software that creates real business value.
      </p>

      <p className="text-[#71717A] text-sm/6 lg:text-base mt-3 lg:mt-5 font-mono">
        Beyond my professional work, I'm continuously expanding my expertise by learning <span className="font-semibold">Flutter</span> for cross-platform mobile development while staying up to date with modern web technologies. Outside of coding, I enjoy working out at the gym, gaming, watching movies, and exploring new technologies. I'm always excited to learn, collaborate, and take on challenging projects that help me grow as a developer.
      </p>
      </motion.div>
    </div>
  );
}
