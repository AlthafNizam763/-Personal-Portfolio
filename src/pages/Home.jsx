import React from "react";
import { motion } from "framer-motion";
import { IoLogoLinkedin, IoLogoWhatsapp } from "react-icons/io5";
import { BiLogoGmail } from "react-icons/bi";
import { BsInstagram } from "react-icons/bs";
import { TypeAnimation } from "react-type-animation";

export default function Home() {
  return (
    <div className="mt-20" id="home">
      <div className="flex justify-between py-10 items-center px-5 lg:px-28 lg:flex-row flex-col-reverse">

        <motion.div
          className="lg:w-[45%]"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >

          <motion.div
            className="text-2xl lg:text-5xl flex flex-col mt-8 lg:mt-0 gap-2 lg:gap-5 text-nowrap"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { staggerChildren: 0.2, ease: "easeInOut" },
              },
            }}
          >
            <motion.h2 variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              Hello, <TypeAnimation
                sequence={[
                  'I am Althaf N',
                  1000,
                  // 'I am a Full Stack Developer',
                  // 1000,
                  // 'I am a UI/UX Designer',
                  // 1000,
                ]}
                speed={10}
                style={{ fontWeight:600 }}
                repeat={Infinity}
              />
            </motion.h2>
            <motion.h2 variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <span className="font-extrabold">Fullstack</span>{" "}
              <span
                className="text-white font-extrabold"
                style={{ WebkitTextStroke: "1px black" }}
              >
                Developer
              </span>
            </motion.h2>
            <motion.h2 variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              Based In <span className="font-extrabold">India.</span>
            </motion.h2>
          </motion.div>

          <motion.p
            className="text-[#71717A] text-sm lg:text-base mt-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            I am passionate about technology and specialize in web development and web design. I am committed to creating innovative solutions while continually advancing my skills. My goal is to grow as a developer and make a significant impact on projects within the tech industry.
          </motion.p>

          <motion.div
          className="flex items-center gap-x-5 mt-10 lg:mt-14"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
        >
          {[
            { Icon: BiLogoGmail, href: "mailto:althafnizam7632gmail.com" },
            { Icon: IoLogoLinkedin, href: "https://www.linkedin.com/in/althaf-nizam-b27489260?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" },
            { Icon: IoLogoWhatsapp, href: "https://wa.me/9633146330" },
            { Icon: BsInstagram, href: "https://www.instagram.com/alth_fx" }
          ].map(({ Icon, href }, index) => (
            <motion.a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white p-2 lg:p-3 rounded border-2 border-black"
              whileHover={{ scale: 1.1, backgroundColor: "#000", color: "#fff" }}
              whileTap={{ scale: 0.9 }}
            >
              <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
            </motion.a>
          ))}
        </motion.div>

        </motion.div>

        <motion.div
          className="lg:w-[55%] w-full"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <img className="h-full w-full" src="/assets/hero-vector.svg" alt="Hero Vector" />
        </motion.div>
      </div>
    </div>
  );
}
