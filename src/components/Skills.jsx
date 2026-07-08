import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaJs, FaReact, FaPhp, FaHtml5, FaCss3, FaLaravel, FaNodeJs, FaGitAlt, FaGithub, FaFigma } from "react-icons/fa";
import { BiLogoPostgresql } from "react-icons/bi";
import { RiNextjsFill, RiTailwindCssFill, RiBootstrapFill } from "react-icons/ri";
import { SiMysql, SiCodeigniter, SiJquery, SiTypescript, SiRedux, SiExpress, SiMongodb, SiPostman } from "react-icons/si";
import { TbApi, TbKey, TbLock, TbShieldLock, TbSparkles, TbDevices, TbBrandVscode } from "react-icons/tb";

export default function Skills() {
  const [skillGroups] = useState([
    {
      category: "Languages",
      skills: [
        { name: "PHP", icon: <FaPhp size={30} /> },
        { name: "JavaScript (ES6+)", icon: <FaJs size={30} /> },
        { name: "TypeScript", icon: <SiTypescript size={30} /> },
        { name: "HTML5", icon: <FaHtml5 size={30} /> },
        { name: "CSS3", icon: <FaCss3 size={30} /> },
      ],
    },
    {
      category: "Frontend",
      skills: [
        { name: "React.js", icon: <FaReact size={30} /> },
        { name: "Next.js", icon: <RiNextjsFill size={30} /> },
        { name: "Bootstrap", icon: <RiBootstrapFill size={30} /> },
        { name: "Tailwind CSS", icon: <RiTailwindCssFill size={30} /> },
        { name: "jQuery", icon: <SiJquery size={30} /> },
        { name: "Redux", icon: <SiRedux size={30} /> },
      ],
    },
    {
      category: "Backend",
      skills: [
        { name: "Laravel", icon: <FaLaravel size={30} /> },
        { name: "CodeIgniter 3", icon: <SiCodeigniter size={30} /> },
        { name: "CodeIgniter 4", icon: <SiCodeigniter size={30} /> },
        { name: "Node.js", icon: <FaNodeJs size={30} /> },
        { name: "Express.js", icon: <SiExpress size={30} /> },
      ],
    },
    {
      category: "Database",
      skills: [
        { name: "MySQL", icon: <SiMysql size={30} /> },
        { name: "PostgreSQL", icon: <BiLogoPostgresql size={30} /> },
        { name: "MongoDB", icon: <SiMongodb size={30} /> },
      ],
    },
    {
      category: "API & Authentication",
      skills: [
        { name: "REST APIs", icon: <TbApi size={30} /> },
        { name: "JWT Authentication", icon: <TbKey size={30} /> },
        { name: "Authentication & Authorization", icon: <TbLock size={30} /> },
        { name: "Role-Based Access Control (RBAC)", icon: <TbShieldLock size={30} /> },
      ],
    },
    {
      category: "Tools",
      skills: [
        { name: "Git", icon: <FaGitAlt size={30} /> },
        { name: "GitHub", icon: <FaGithub size={30} /> },
        { name: "Postman", icon: <SiPostman size={30} /> },
        { name: "VS Code", icon: <TbBrandVscode size={30} /> },
        { name: "Figma", icon: <FaFigma size={30} /> },
      ],
    },
    {
      category: "Others",
      skills: [
        { name: "AI Prompt Engineering", icon: <TbSparkles size={30} /> },
        { name: "Responsive Web Design", icon: <TbDevices size={30} /> },
      ],
    },
  ]);

  const [experiences] = useState([
    {
      id: 1,
      company: "DOCME CLOUD SOLUTIONS",
      role: "Software Engineer",
      period: "July 3024 - Present",
      description:
        "Working as a Software Engineer at DocMe Cloud Solutions, I specialize in building scalable full-stack applications using Laravel, CodeIgniter, Node.js, React.js, Next.js, MySQL, PostgreSQL, and MongoDB. My role involves developing RESTful APIs, optimizing application performance, resolving production issues, and delivering secure, high-performance solutions while collaborating with cross-functional teams in an Agile development environment.",
      logo: "assets/docme.png",
    },
  ]);

  return (
    <div className="mt-3 lg:mt-16" id="skills">
      <div className="px-5 lg:px-28">

        <motion.h2
          className="text-2xl lg:text-4xl text-center"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          My <span className="font-extrabold">Skills</span>
        </motion.h2>

        {/* Categorized Skills */}
        <div className="mt-7 lg:mt-16 space-y-8 lg:space-y-10">
          {skillGroups.map((group, groupIndex) => (
            <motion.div
              key={group.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: groupIndex * 0.05 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-4 mb-4 lg:mb-6">
                <h3 className="text-lg lg:text-2xl font-extrabold whitespace-nowrap">
                  {group.category}
                </h3>
                <span className="h-[2px] w-full bg-black/10" />
              </div>

              <div className="flex flex-wrap gap-3 lg:gap-4">
                {group.skills.map((skill, index) => (
                  <motion.div
                    key={skill.name}
                    className="flex items-center gap-2 border-2 border-black rounded px-3 py-2 lg:px-4 lg:py-2.5 font-semibold text-sm lg:text-base hover:bg-black hover:text-white transition-all cursor-pointer"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.04 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -3 }}
                  >
                    {skill.icon}
                    <span>{skill.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Experience Section */}
      <div className="bg-black w-full my-8 py-8 lg:my-16 lg:py-16">
        <motion.h2
          className="text-2xl lg:text-4xl text-center text-white"
          initial={{ opacity: 0, y: -30 }}
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
              initial={{ opacity: 0, x: -30 }}
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
