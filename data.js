/* Edit this file to change what the site and the chatbot know about.
   n = assignment number, kw = words that should open it, link = optional page to open (leave '' for none). */
window.SITE_DATA = {
  assignments: [
    { n: 1, title: 'Digital Portfolio', kw: ['portfolio', 'about me', 'resume'], link: '',
      summary: 'My personal portfolio: about me, education, skills, featured projects, and contact.',
      explain: 'Assignment 1 is my personal portfolio. It introduces who I am, my education at Caldwell University, my skills, and the projects I have built, with a contact form to reach me.' },
    { n: 2, title: 'Digital Citizenship', kw: ['citizenship', 'ethics', 'rep'], link: '',
      summary: 'The 9 elements of digital citizenship, the REP framework, digital law, AI ethics, a quiz, and a checklist.',
      explain: 'Assignment 2 covers responsible technology use. It explains the 9 elements of digital citizenship and the REP framework (Respect, Educate, Protect), then digital law, privacy, and AI ethics, and ends with a self-assessment quiz and a habits checklist.' },
    { n: 3, title: 'The Internet', kw: ['internet', 'netbot', 'network', 'protocol'], link: '',
      summary: 'How the internet works, ISPs, browsers, search engines, the NetBot chatbot, and a packet simulator.',
      explain: 'Assignment 3 explains how the internet works: ISPs, web browsers, search engines, and protocols like TCP/IP and DNS. It includes the NetBot study chatbot, an AI digital person, and a simulator that follows a packet across the network.' },
    { n: 4, title: 'Software, Hardware, Storage and I/O Devices', kw: ['hardware', 'software', 'storage', 'devices', 'io'], link: '',
      summary: 'Guides to software types, computer parts, storage devices, and input and output devices.',
      explain: 'Assignment 4 is a set of computer-systems guides: types of software, the core hardware parts (CPU, RAM, GPU, and more), storage types and backups, and input and output devices.' },
    { n: 5, title: 'AI Movie Agent: ECHO', kw: ['movie', 'echo', 'film', 'agent', 'storyboard'], link: '',
      summary: 'A multi-agent AI workflow that produced ECHO, a 3-minute horror short about AI taking control.',
      explain: 'Assignment 5 is the AI Movie Agent. A chain of AI roles (director, script, characters, storyboard, video, audio, and editing) produced ECHO, a 3-minute horror short about an AI that slowly takes control of its user.' },
    { n: 6, title: 'Chalkroom: A Team of AI Tutors', kw: ['chalkroom', 'tutors', 'idea', 'team'], link: '#idea',
      summary: 'My original website idea: one AI assistant for every school subject, plus a router.',
      explain: 'Assignment 6 is my original idea, Chalkroom. Instead of one chatbot for everything, a router sends each question to a specialist assistant for math, science, writing, history, technology, languages, or study skills.' },
    { n: 7, title: 'Data Analysis', kw: ['data', 'analysis', 'chart', 'visualization'], link: '',
      summary: 'Placeholder: add your data analysis project here.',
      explain: 'Assignment 7 is a placeholder for my data analysis project. Edit data.js to add its real description.' }
  ],
  products: [
    { id: 1, name: 'Wireless Keyboard', price: 34.99, tags: 'keyboard wireless typing' },
    { id: 2, name: 'Compact Bluetooth Keyboard', price: 29.99, tags: 'keyboard wireless bluetooth typing' },
    { id: 3, name: 'Wireless Mouse', price: 19.99, tags: 'mouse wireless' },
    { id: 4, name: 'Noise-Canceling Headphones', price: 59.0, tags: 'headphones audio study' },
    { id: 5, name: 'Spiral Notebook 5-Pack', price: 12.5, tags: 'notebook paper notes' },
    { id: 6, name: 'Scientific Calculator', price: 24.0, tags: 'calculator math' },
    { id: 7, name: 'Laptop Backpack', price: 42.0, tags: 'backpack bag laptop' },
    { id: 8, name: 'LED Desk Lamp', price: 21.99, tags: 'lamp light desk' },
    { id: 9, name: 'USB-C Hub', price: 27.0, tags: 'hub usb adapter' },
    { id: 10, name: '128GB Flash Drive', price: 14.0, tags: 'flash drive usb storage' }
  ],
  scenes: {
    beach: 'radial-gradient(circle at 78% 20%,#fff6b0 0,#ffd54a 3%,transparent 8%),linear-gradient(#7fd3f7 0%,#c9edfb 38%,#1b8fc4 38%,#2fb3d9 56%,#f0d9a0 56%,#e2c183 100%)',
    sunset: 'linear-gradient(#2b1055 0%,#7a2f7a 35%,#e8546b 65%,#ffb35c 100%)',
    forest: 'linear-gradient(#cfe8d5 0%,#7fb685 35%,#2f6b45 70%,#173b27 100%)',
    space: 'radial-gradient(circle at 20% 30%,#fff 0,transparent 1.5px),radial-gradient(circle at 70% 60%,#fff 0,transparent 1.5px),radial-gradient(circle at 45% 80%,#fff 0,transparent 1.5px),radial-gradient(circle at 85% 15%,#a9b8ff 0,transparent 80px),#050816',
    mountains: 'linear-gradient(#a9d4f5 0%,#dcecf7 45%,#8b97a6 45%,#5d6a7a 65%,#2e3744 100%)'
  }
};
