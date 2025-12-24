import React from 'react';
import { TbExternalLink } from "react-icons/tb";
import { motion } from 'framer-motion';

const projects = [
  {
    id: 1,
    title: "Zenith Academy",
    description:
      "Discover an informative website designed to help you easily download the app and connect with him directly. Don't miss out on the opportunity to enhance your experience!",
    image: "assets/zenith.jpg",
    link: "https://www.zenithacademy.in/"
  },
  {
    id: 2,
    title: "Loyaltri",
    description:
      "Loyaltri is an all-in-one HRMS platform built to simplify and automate everyday HR tasks like hiring, onboarding, payroll, attendance, and communication. Designed with real HR teams in mind, Loyaltri helps businesses boost efficiency, reduce manual work, and focus on growth. Explore the platform to see how we’ve made HR smarter, faster, and stress-free.",
    video: "assets/Loyaltri.mp4",
    link: "https://www.loyaltri.com/"
  },
  {
    id: 3,
    title: "Voice of the Voiceless",
    description:
      "A platform dedicated to amplifying the voices of those often unheard, focusing on social issues and community empowerment.",
    image: "assets/Voice.png", 
    link: "https://www.voiceofthevoiceless.co.in/"
  }
];

export default function Projects() {
  return (
    <div className="bg-black px-5 lg:px-28 py-8 my-8 lg:py-16 lg:my-16" id="projects">
      <h2 className="text-2xl lg:text-4xl text-center text-white">
        My <span className="font-extrabold">Projects</span>
      </h2>

      <div className="lg:mt-16 mt-8 lg:space-y-16 space-y-8 lg:pb-6 pb-3">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            className={`flex justify-between items-center flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
              }`}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 10, delay: index * 0.2 }}
            viewport={{ once: true }}
          >
            <div className="lg:w-[500px] w-full rounded-2xl overflow-hidden shadow-lg">
              {project.image ? (
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                />
              ) : project.video ? (
                <video
                  src={project.video}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>

            <div className="lg:w-1/2 lg:space-y-6 space-y-4">
              <h2 className="font-extrabold text-white mt-5 lg:mt-0 text-3xl lg:text-5xl">
                {String(project.id).padStart(2, "0")}
              </h2>
              <p className="font-bold text-white text-xl lg:text-3xl">{project.title}</p>

              <p className="font-mono text-sm/6 lg:text-base text-[#71717A]">
                {project.description}
              </p>

              <a
                href={project.link}
                className="text-white mt-3 inline-flex items-center gap-1 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                <TbExternalLink size={23} />
                View Project
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
