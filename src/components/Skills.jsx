import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaJs, FaReact, FaPhp, FaJava, FaHtml5, FaCss3 } from "react-icons/fa";
import { BiLogoPostgresql } from "react-icons/bi";
import { RiNextjsFill,RiTailwindCssFill,RiBootstrapFill } from "react-icons/ri";
import { SiMysql,SiCodeigniter,SiJquery,SiTypescript } from "react-icons/si";
// import { CgFigma } from "react-icons/cg";

export default function Skills() {
  const [skills] = useState([
    { id: 1, name: "HTML", icon: <FaHtml5 size={50} /> },
    { id: 2, name: "CSS", icon: <FaCss3 size={50} /> },
    { id: 3, name: "JavaScript", icon: <FaJs size={50} /> },
    { id: 4, name: "React", icon: <FaReact size={50} /> },
    { id: 5, name: "Php", icon: <FaPhp size={50} /> },
    { id: 6, name: "Java", icon: <FaJava size={50} /> },
    { id: 7, name: "Mysql", icon: <SiMysql size={50} /> },
    { id: 8, name: "Postgresql", icon: <BiLogoPostgresql size={50} /> },
    { id: 9, name: "Next.js", icon: <RiNextjsFill size={50} /> },
    { id: 10, name: "Tailwind", icon: <RiTailwindCssFill size={50} /> },
    { id: 11, name: "Bootstrap", icon: <RiBootstrapFill size={50} /> },
    { id: 12, name: "Codeigniter", icon: <SiCodeigniter size={50} /> },
    { id: 13, name: "jQuery", icon: <SiJquery size={50} /> },
    { id: 14, name: "Typescript", icon: <SiTypescript size={50} /> }
  ]);

  const [experiences] = useState([
    {
      id: 1,
      company: "DOCME CLOUD SOLUTIONS",
      role: "Jr Software Engineer",
      period: "July 2024 - Present",
      description:
        "At DocMe Cloud Solutions, I work as a Jr software engineer focusing on full-stack development. My responsibilities include building and maintaining applications using PHP, React.js, MySQL, and PostgreSQL. I collaborate with cross-functional teams to deliver efficient, scalable solutions and actively contribute to debugging, optimization, and feature enhancements across both frontend and backend systems.",
      logo: "assets/docme.png",
    },
  ]);

  return (
    <div className="mt-3 lg:mt-16" id="skills">
      <div className="px-5 lg:px-28">

        <motion.h2
          className="text-2xl lg:text-4xl text-center"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          My <span className="font-extrabold">Skills</span>
        </motion.h2>

        {/* Skill Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 text-lg font-bold mt-7 lg:mt-16 w-full place-items-center gap-y-6 lg:gap-y-12">
          {skills.map((skill) => (
            <motion.div
              key={skill.id}
              className="bg-white border-2 hover:bg-black hover:text-white transition-all cursor-pointer border-black rounded p-3 h-36 w-36 lg:h-44 lg:w-44 flex flex-col items-center justify-center gap-5"
              initial={{ opacity: 0, y: 5 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: skill.id * 0.1 }}
              viewport={{ once: true }}
            >
              {skill.icon}
              <p>{skill.name}</p>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Experience Section */}
      <div className="bg-black w-full my-8 py-8 lg:my-16 lg:py-16">
        <motion.h2
          className="text-2xl lg:text-4xl text-center text-white"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          My <span className="font-extrabold">Experience</span>
        </motion.h2>

        {/* Experience Cards */}
        <div className="px-5 lg:px-28 my-8 lg:mt-16 space-y-10">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.id}
              className="bg-black p-5 border border-[#D4D4D8] rounded-md hover:bg-[#27272A] transition-all cursor-pointer "
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 10,
                delay: index * 0.2,
              }}
              viewport={{ once: true }}
            >
              <div className="flex justify-between flex-col items-start lg:flex-row lg:items-center">
                <div className="flex items-center gap-5">
                  <img className="w-7" src={exp.logo} alt="" />
                  <h2 className="font-semibold text-white text-lg lg:text-xl">
                    {exp.role} at {exp.company}
                  </h2>
                </div>
                <span className="text-[#D4D4D8] font-semibold text-sm mt-4 lg:mt-0 lg:text-base">
                  {exp.period}
                </span>
              </div>
              <p className="text-[#D4D4D8] mt-6 text-sm/6 lg:text-base font-mono">
                {exp.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
