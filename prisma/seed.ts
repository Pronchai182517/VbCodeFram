import "dotenv/config";
import { PrismaClient, DegreeLevel } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { seedCore, seedUser } from "./lib/seed-core";
import { requireDatabaseUrl } from "./lib/require-database-url";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }) });

/** รหัสผ่านทุกบัญชีตัวอย่าง */
export const DEV_PASSWORD = "Passw0rd!vibe";

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PROD !== "1") {
    console.error("[seed] ปฏิเสธ: NODE_ENV=production — ใช้ npm run db:bootstrap แทน");
    process.exit(1);
  }
  const core = await seedCore(prisma, { tenantCode: "DEMO", nameTh: "องค์กรตัวอย่าง", nameEn: "Sample Organization" });
  const hash = await bcrypt.hash(DEV_PASSWORD, 12);
  const users = [
    { email: "admin@app.local", name: "ผู้ดูแลสูงสุด", roles: ["SUPER_ADMIN"] },
    { email: "staff@app.local", name: "เจ้าหน้าที่", roles: ["STAFF"] },
    { email: "viewer@app.local", name: "ผู้ดู", roles: ["VIEWER"] },
    { email: "lockme@app.local", name: "บัญชีทดสอบล็อก", roles: ["VIEWER"] },
    { email: "forced@app.local", name: "บัญชีบังคับเปลี่ยนรหัส", roles: ["VIEWER"], mustChangePassword: true },
  ];
  for (const u of users) {
    await seedUser(prisma, core.tenantId, { ...u, passwordHash: hash, roleIds: u.roles.map((c) => core.roleIds[c]) });
  }

  // Seed sample faculty news
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@app.local" } });
  if (adminUser) {
    const sampleArticles = [
      {
        slug: "admissions-open-tcas69",
        category: "ANNOUNCEMENT" as const,
        status: "PUBLISHED" as const,
        titleTh: "เปิดรับสมัครนักศึกษาใหม่ระดับปริญญาตรี ประจำปีการศึกษา 2569 (TCAS 69)",
        titleEn: "Undergraduate Admissions Open for Academic Year 2026 (TCAS 69)",
        contentTh: "คณะเปิดรับสมัครนักศึกษาใหม่ระดับปริญญาตรี ประจำปีการศึกษา 2569 ผู้สมัครสามารถตรวจสอบคุณสมบัติ แผนการเรียน และกำหนดการยื่นสมัครในแต่ละรอบผ่านระบบรับสมัครออนไลน์ของคณะ พร้อมเอกสารคู่มือการสมัครฉบับสมบูรณ์",
        contentEn: "The Faculty announces the opening of undergraduate admissions for Academic Year 2026. Prospective students can review entry requirements, study programs, and application timelines through the faculty online admission portal.",
        isPinned: true,
        coverImageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop",
        viewCount: 142,
        publishedAt: new Date(),
        attachments: [
          {
            fileName: "announcement-tcas69.pdf",
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            fileSize: 1048576,
            mimeType: "application/pdf",
          },
        ],
      },
      {
        slug: "faculty-research-award-2026",
        category: "ACADEMIC" as const,
        status: "PUBLISHED" as const,
        titleTh: "คณาจารย์และนักวิจัยคณะ คว้ารางวัลผลงานวิจัยยอดเยี่ยมระดับนานาชาติ IEEE 2026",
        titleEn: "Faculty Researchers Receive Prestigious IEEE 2026 Best Research Award",
        contentTh: "ขอแสดงความยินดีกับทีมคณาจารย์และนักศึกษาปริญญาเอก ในโอกาสได้รับรางวัล Best Paper Award จากการประชุมวิชาการนานาชาติ IEEE ในหัวข้อการประยุกต์ใช้ปัญญาประดิษฐ์เพื่อการแพทย์อัจฉริยะและการวิเคราะห์ภาพถ่ายความละเอียดสูง",
        contentEn: "Congratulations to our faculty professors and Ph.D. researchers for winning the prestigious Best Paper Award at the IEEE International Conference for their research on AI in smart healthcare diagnostics.",
        isPinned: true,
        coverImageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1200&auto=format&fit=crop",
        viewCount: 89,
        publishedAt: new Date(Date.now() - 86400000 * 2),
        attachments: [],
      },
      {
        slug: "annual-digital-innovation-expo-2026",
        category: "ACTIVITY" as const,
        status: "PUBLISHED" as const,
        titleTh: "ขอเชิญร่วมงานนิทรรศการโครงงานนวัตกรรมดิจิทัล Faculty Innovation Expo 2026",
        titleEn: "Invitation to Faculty Digital Innovation Expo 2026",
        contentTh: "ขอเชิญชวนคณาจารย์ นักศึกษา บุคลากร และบุคคลทั่วไป ร่วมชมการแสดงผลงานนวัตกรรมสิ่งประดิษฐ์ ซอฟต์แวร์ และโครงงานจบการศึกษาของนักศึกษาชั้นปีที่ 4 พร้อมกิจกรรมเสวนาทิศทางเทคโนโลยีแห่งอนาคต",
        contentEn: "Join us at the Faculty Innovation Expo 2026 featuring capstone design projects, IoT prototypes, and software platforms developed by senior undergraduate and postgraduate students.",
        isPinned: false,
        coverImageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop",
        viewCount: 57,
        publishedAt: new Date(Date.now() - 86400000 * 5),
        attachments: [],
      },
    ];

    for (const art of sampleArticles) {
      const { attachments, ...articleData } = art;
      const existing = await prisma.article.findFirst({
        where: { tenantId: core.tenantId, slug: art.slug },
      });

      if (!existing) {
        await prisma.article.create({
          data: {
            ...articleData,
            tenantId: core.tenantId,
            authorId: adminUser.id,
            attachments: {
              create: attachments,
            },
          },
        });
      }
    }

    // Seed sample departments
    const sampleDepts = [
      { code: "DEAN_OFFICE", nameTh: "สำนักงานคณบดี", nameEn: "Office of the Dean", orderIndex: 1 },
      { code: "CPE", nameTh: "ภาควิชาวิศวกรรมคอมพิวเตอร์", nameEn: "Department of Computer Engineering", orderIndex: 2 },
      { code: "EE", nameTh: "ภาควิชาวิศวกรรมไฟฟ้า", nameEn: "Department of Electrical Engineering", orderIndex: 3 },
      { code: "ME", nameTh: "ภาควิชาวิศวกรรมเครื่องกล", nameEn: "Department of Mechanical Engineering", orderIndex: 4 },
    ];

    const deptMap: Record<string, string> = {};
    for (const d of sampleDepts) {
      const dept = await prisma.department.upsert({
        where: { tenantId_code: { tenantId: core.tenantId, code: d.code } },
        update: { nameTh: d.nameTh, nameEn: d.nameEn, orderIndex: d.orderIndex },
        create: { ...d, tenantId: core.tenantId },
      });
      deptMap[d.code] = dept.id;
    }

    // Seed sample faculty & staff
    const sampleStaff = [
      {
        departmentId: deptMap.CPE,
        prefixTh: "ศ.ดร.",
        prefixEn: "Prof. Dr.",
        firstNameTh: "สมชาย",
        lastNameTh: "เจริญวิทย์",
        firstNameEn: "Somchai",
        lastNameEn: "Charoenwit",
        academicPosition: "ศาสตราจารย์ ดร.",
        adminPositionTh: "คณบดี",
        adminPositionEn: "Dean",
        email: "dean@faculty.ac.th",
        phone: "02-555-1001",
        roomNumber: "อาคาร 1 ห้อง 101",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
        bioTh: "ผู้เชี่ยวชาญด้านปัญญาประดิษฐ์และวิทยาการหุ่นยนต์ ประสบการณ์วิจัยกว่า 25 ปี ผลงานตีพิมพ์ระดับนานาชาติกว่า 80 เรื่อง",
        bioEn: "Expert in Artificial Intelligence and Robotics with over 25 years of research experience and 80+ international publications.",
        expertise: ["Artificial Intelligence", "Robotics", "Deep Learning", "Computer Vision"],
        orderIndex: 1,
        isActive: true,
      },
      {
        departmentId: deptMap.EE,
        prefixTh: "รศ.ดร.",
        prefixEn: "Assoc. Prof. Dr.",
        firstNameTh: "วิภาดา",
        lastNameTh: "มณีรัตน์",
        firstNameEn: "Vipada",
        lastNameEn: "Maneerat",
        academicPosition: "รองศาสตราจารย์ ดร.",
        adminPositionTh: "รองคณบดีฝ่ายวิชาการ",
        adminPositionEn: "Associate Dean for Academic Affairs",
        email: "vipada.m@faculty.ac.th",
        phone: "02-555-1002",
        roomNumber: "อาคาร 2 ห้อง 305",
        avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop",
        bioTh: "หัวหน้ากลุ่มวิจัยพลังงานทดแทนและโครงข่ายไฟฟ้าอัจฉริยะ (Smart Grid) อดีตที่ปรึกษาการไฟฟ้านครหลวง",
        bioEn: "Head of Renewable Energy and Smart Grid Research Laboratory, technical advisor for sustainable energy transitions.",
        expertise: ["Smart Grid", "Renewable Energy", "Power Systems", "Energy Storage"],
        orderIndex: 2,
        isActive: true,
      },
      {
        departmentId: deptMap.CPE,
        prefixTh: "ผศ.ดร.",
        prefixEn: "Asst. Prof. Dr.",
        firstNameTh: "กิตติศักดิ์",
        lastNameTh: "ภักดีสกุล",
        firstNameEn: "Kittisak",
        lastNameEn: "Phakdeesakul",
        academicPosition: "ผู้ช่วยศาสตราจารย์ ดร.",
        adminPositionTh: "หัวหน้าภาควิชาวิศวกรรมคอมพิวเตอร์",
        adminPositionEn: "Head of Computer Engineering Department",
        email: "kittisak.p@faculty.ac.th",
        phone: "02-555-2101",
        roomNumber: "อาคาร 4 ห้อง 402",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
        bioTh: "อาจารย์ที่ปรึกษาและผู้เชี่ยวชาญด้าน Software Architecture, Distributed Systems และ Cloud Computing",
        bioEn: "Academic advisor and specialist in Software Architecture, Distributed Systems, and Enterprise Cloud Computing.",
        expertise: ["Software Architecture", "Cloud Native", "Microservices", "Full-stack Engineering"],
        orderIndex: 3,
        isActive: true,
      },
      {
        departmentId: deptMap.CPE,
        prefixTh: "อ.ดร.",
        prefixEn: "Dr.",
        firstNameTh: "ณัฐนนท์",
        lastNameTh: "วงศ์สุวรรณ",
        firstNameEn: "Nattanon",
        lastNameEn: "Wongsuwan",
        academicPosition: "อาจารย์ ดร.",
        adminPositionTh: null,
        adminPositionEn: null,
        email: "nattanon.w@faculty.ac.th",
        phone: "02-555-2104",
        roomNumber: "อาคาร 4 ห้อง 408",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
        bioTh: "ผู้เชี่ยวชาญด้านความปลอดภัยทางไซเบอร์ การเข้ารหัสลับ และการตรวจจับภัยคุกคามในระบบสารสนเทศ",
        bioEn: "Cybersecurity specialist focused on applied cryptography, threat detection, and network defense architectures.",
        expertise: ["Cybersecurity", "Applied Cryptography", "Ethical Hacking", "Network Security"],
        orderIndex: 4,
        isActive: true,
      },
    ];

    for (const st of sampleStaff) {
      const existing = await prisma.staffProfile.findFirst({
        where: { tenantId: core.tenantId, email: st.email },
      });
      if (!existing) {
        await prisma.staffProfile.create({
          data: {
            ...st,
            tenantId: core.tenantId,
          },
        });
      }
    }

    // ==========================================
    // Seed Curriculum (Programs & Courses)
    // ==========================================
    const samplePrograms = [
      {
        code: "CPE-BENG-2565",
        degreeLevel: DegreeLevel.BACHELOR,
        nameTh: "หลักสูตรวิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมคอมพิวเตอร์",
        nameEn: "Bachelor of Engineering Program in Computer Engineering",
        shortNameTh: "วศ.บ. (วิศวกรรมคอมพิวเตอร์)",
        shortNameEn: "B.Eng. (Computer Engineering)",
        totalCredits: 140,
        yearIssued: 2565,
        tuitionFeeTerm: 25000,
        descriptionTh: "หลักสูตรมุ่งเน้นการสร้างวิศวกรคอมพิวเตอร์ที่มีความเชี่ยวชาญด้าน Software Architecture, Cloud-Native Systems, Artificial Intelligence และ Cyber Security พร้อมรับมือกับเทคโนโลยีระดับโลก",
        descriptionEn: "World-class curriculum focusing on Software Architecture, Cloud Systems, AI, and Cybersecurity.",
        careerProspects: ["Software Engineer", "Full-Stack Developer", "DevOps Engineer", "Cloud Architect", "AI Engineer"],
        leafletPdfUrl: "https://example.com/cpe-curriculum-2565.pdf",
        isActive: true,
      },
      {
        code: "EE-BENG-2565",
        degreeLevel: DegreeLevel.BACHELOR,
        nameTh: "หลักสูตรวิศวกรรมศาสตรบัณฑิต สาขาวิชาวิศวกรรมไฟฟ้าและระบบโครงข่ายอัจฉริยะ",
        nameEn: "Bachelor of Engineering Program in Electrical Engineering & Smart Grid",
        shortNameTh: "วศ.บ. (วิศวกรรมไฟฟ้า)",
        shortNameEn: "B.Eng. (Electrical Engineering)",
        totalCredits: 142,
        yearIssued: 2565,
        tuitionFeeTerm: 25000,
        descriptionTh: "หลักสูตรที่ผสมผสานวิศวกรรมไฟฟ้ายุคใหม่ พลังงานสะอาด โครงข่ายไฟฟ้าอัจฉริยะ (Smart Grid) และยานยนต์ไฟฟ้า (EV)",
        descriptionEn: "Modern electrical engineering integrated with clean renewable energy, smart grids, and EV technology.",
        careerProspects: ["Electrical Engineer", "Smart Grid Specialist", "Renewable Energy Engineer", "Power Systems Analyst"],
        leafletPdfUrl: "https://example.com/ee-curriculum-2565.pdf",
        isActive: true,
      },
      {
        code: "DSAI-MENG-2566",
        degreeLevel: DegreeLevel.MASTER,
        nameTh: "หลักสูตรวิทยาศาสตรมหาบัณฑิต สาขาวิชาวิทยาการข้อมูลและปัญญาประดิษฐ์",
        nameEn: "Master of Science Program in Data Science and Artificial Intelligence",
        shortNameTh: "วท.ม. (วิทยาการข้อมูลและปัญญาประดิษฐ์)",
        shortNameEn: "M.Sc. (Data Science & AI)",
        totalCredits: 36,
        yearIssued: 2566,
        tuitionFeeTerm: 45000,
        descriptionTh: "หลักสูตรระดับบัณฑิตศึกษาเพื่อผลิตผู้นำด้านเทคโนโลยี AI และ Data Science สำหรับขับเคลื่อนภาคอุตสาหกรรมและการวิจัย",
        descriptionEn: "Graduate program cultivating leaders in AI research, Machine Learning, and Big Data technologies.",
        careerProspects: ["Data Scientist", "Machine Learning Specialist", "AI Research Scientist", "Chief Data Officer"],
        leafletPdfUrl: "https://example.com/dsai-curriculum-2566.pdf",
        isActive: true,
      },
      {
        code: "ENG-PHD-2564",
        degreeLevel: DegreeLevel.DOCTORAL,
        nameTh: "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาวิศวกรรมศาสตร์ขั้นสูง",
        nameEn: "Doctor of Philosophy Program in Advanced Engineering",
        shortNameTh: "ปร.ด. (วิศวกรรมศาสตร์)",
        shortNameEn: "Ph.D. (Advanced Engineering)",
        totalCredits: 48,
        yearIssued: 2564,
        tuitionFeeTerm: 60000,
        descriptionTh: "หลักสูตรดุษฎีบัณฑิตมุ่งเน้นการสร้างสรรค์องค์ความรู้ใหม่ระดับแนวหน้า (Frontier Research) ร่วมกับสถาบันวิจัยระดับนานาชาติ",
        descriptionEn: "Doctoral research program producing pioneering research in cutting-edge engineering fields.",
        careerProspects: ["University Professor", "Principal Research Scientist", "R&D Director"],
        leafletPdfUrl: "https://example.com/phd-curriculum-2564.pdf",
        isActive: true,
      },
    ];

    const programMap: Record<string, string> = {};

    for (const prog of samplePrograms) {
      let program = await prisma.program.findUnique({
        where: { tenantId_code: { tenantId: core.tenantId, code: prog.code } },
      });
      if (!program) {
        program = await prisma.program.create({
          data: {
            ...prog,
            tenantId: core.tenantId,
          },
        });
      }
      programMap[prog.code] = program.id;
    }

    // Seed Courses
    const sampleCourses = [
      // CPE Courses
      {
        programId: programMap["CPE-BENG-2565"],
        code: "CPE101",
        nameTh: "การเขียนโปรแกรมคอมพิวเตอร์พื้นฐาน",
        nameEn: "Computer Programming Fundamentals",
        credits: "3(3-0-6)",
        categoryGroup: "หมวดวิชาเฉพาะด้าน",
        descriptionTh: "หลักการเขียนโปรแกรม โครงสร้างภาษา ลูป อาเรย์ ฟังก์ชัน และการเขียนโค้ดตามมาตรฐานวิศวกรรม",
      },
      {
        programId: programMap["CPE-BENG-2565"],
        code: "CPE201",
        nameTh: "โครงสร้างข้อมูลและขั้นตอนวิธี",
        nameEn: "Data Structures and Algorithms",
        credits: "3(3-0-6)",
        categoryGroup: "หมวดวิชาเฉพาะด้าน",
        descriptionTh: "โครงสร้างข้อมูลแบบเชิงเส้นและไม่เชิงเส้น การวิเคราะห์ความซับซ้อนของอัลกอริทึม กราฟ และทรี",
      },
      {
        programId: programMap["CPE-BENG-2565"],
        code: "CPE322",
        nameTh: "สถาปัตยกรรมซอฟต์แวร์และการประมวลผลบนคลาวด์",
        nameEn: "Software Architecture and Cloud Computing",
        credits: "3(2-2-5)",
        categoryGroup: "หมวดวิชาเอกเลือก",
        descriptionTh: "การออกแบบระบบแบบกระจาย Microservices, Containerization, Docker, Kubernetes และ CI/CD",
      },
      {
        programId: programMap["CPE-BENG-2565"],
        code: "CPE491",
        nameTh: "โครงงานวิศวกรรมคอมพิวเตอร์",
        nameEn: "Computer Engineering Capstone Project",
        credits: "3(0-6-3)",
        categoryGroup: "หมวดวิทยานิพนธ์/โครงงาน",
        descriptionTh: "การบูรณาการองค์ความรู้ตลอดหลักสูตรเพื่อพัฒนานวัตกรรมหรือแก้ปัญหาจริงในอุตสาหกรรม",
      },
      // EE Courses
      {
        programId: programMap["EE-BENG-2565"],
        code: "EE101",
        nameTh: "การวิเคราะห์วงจรไฟฟ้า",
        nameEn: "Electric Circuit Analysis",
        credits: "3(3-0-6)",
        categoryGroup: "หมวดวิชาเฉพาะด้าน",
        descriptionTh: "ทฤษฎีวงจรไฟฟ้า กฎของเคอร์ชอฟฟ์ วงจรไฟฟ้ากระแสสลับ และการตอบสนองความถี่",
      },
      {
        programId: programMap["EE-BENG-2565"],
        code: "EE341",
        nameTh: "ระบบโครงข่ายไฟฟ้าอัจฉริยะ",
        nameEn: "Smart Grid Systems",
        credits: "3(3-0-6)",
        categoryGroup: "หมวดวิชาเอกเลือก",
        descriptionTh: "การรวมพลังงานหมุนเวียนเข้าสู่ระบบสายส่ง การจัดการโหลดและการสื่อสารในโครงข่ายอัจฉริยะ",
      },
      // DSAI Courses
      {
        programId: programMap["DSAI-MENG-2566"],
        code: "DS601",
        nameTh: "การเรียนรู้ของเครื่องและการเรียนรู้เชิงลึก",
        nameEn: "Machine Learning and Deep Learning",
        credits: "3(3-0-6)",
        categoryGroup: "หมวดวิชาเฉพาะด้าน",
        descriptionTh: "อัลกอริทึม Supervised, Unsupervised, Convolutional Neural Networks และ Large Language Models",
      },
      {
        programId: programMap["DSAI-MENG-2566"],
        code: "DS701",
        nameTh: "วิทยานิพนธ์ระดับมหาบัณฑิต",
        nameEn: "Master's Thesis",
        credits: "12(0-36-0)",
        categoryGroup: "หมวดวิทยานิพนธ์/โครงงาน",
        descriptionTh: "การดำเนินการวิจัยเชิงลึกด้านวิทยาการข้อมูลหรือปัญญาประดิษฐ์ภายใต้การกำกับของอาจารย์ที่ปรึกษา",
      },
    ];

    for (const c of sampleCourses) {
      if (!c.programId) continue;
      const existingCourse = await prisma.course.findUnique({
        where: { tenantId_code: { tenantId: core.tenantId, code: c.code } },
      });
      if (!existingCourse) {
        await prisma.course.create({
          data: {
            ...c,
            tenantId: core.tenantId,
          },
        });
      }
    }
    // Seed sample document requests
    const staffUser = await prisma.user.findUnique({ where: { email: "staff@app.local" } });
    const viewerUser = await prisma.user.findUnique({ where: { email: "viewer@app.local" } });

    if (adminUser && staffUser && viewerUser) {
      const sampleDocs = [
        {
          trackingNo: "DOC-2026-0001",
          docType: "LEAVE" as const,
          title: "ขออนุมัติลาพักผ่อนประจำปีเพื่อไปจัดการธุระส่วนตัว",
          description: "ขอลาพักผ่อนประจำปีเป็นเวลา 3 วันทำการ ระหว่างวันที่ 15-17 มีนาคม 2569",
          status: "APPROVED" as const,
          currentStepIndex: 2,
          totalSteps: 2,
          requesterId: staffUser.id,
          fileAttachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          routes: [
            {
              stepIndex: 1,
              title: "หัวหน้างาน / ผู้บังคับบัญชาเบื้องต้น",
              approverId: adminUser.id,
              status: "APPROVED" as const,
              comment: "ตรวจสอบวันลาคงเหลือแล้ว เห็นควรอนุมัติ",
              actionAt: new Date(Date.now() - 86400000),
            },
            {
              stepIndex: 2,
              title: "คณบดี / ผู้มีอำนาจลงนามขั้นสุดท้าย",
              approverId: adminUser.id,
              status: "APPROVED" as const,
              comment: "อนุมัติตามระเบียบการลา",
              actionAt: new Date(),
            },
          ],
        },
        {
          trackingNo: "DOC-2026-0002",
          docType: "EXPENSE_REIMBURSE" as const,
          title: "ขออนุมัติเบิกจ่ายงบประมาณจัดซื้ออุปกรณ์ห้องปฏิบัติการ AI & IoT",
          description: "ขอเบิกจ่ายงบประมาณหมวดครุภัณฑ์การศึกษา เพื่อจัดซื้อบอร์ดประมวลผลสมองกลฝังตัวและเซนเซอร์",
          status: "PENDING" as const,
          currentStepIndex: 2,
          totalSteps: 2,
          requesterId: viewerUser.id,
          fileAttachmentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          routes: [
            {
              stepIndex: 1,
              title: "หัวหน้าภาควิชา",
              approverId: staffUser.id,
              status: "APPROVED" as const,
              comment: "ตรวจสอบรายการครุภัณฑ์แล้ว สอดคล้องกับแผนการสอน",
              actionAt: new Date(Date.now() - 3600000 * 5),
            },
            {
              stepIndex: 2,
              title: "รองคณบดีฝ่ายบริหารและคลัง",
              approverId: adminUser.id,
              status: "PENDING" as const,
              comment: null,
              actionAt: null,
            },
          ],
        },
        {
          trackingNo: "DOC-2026-0003",
          docType: "OFFICIAL_LETTER" as const,
          title: "ขอหนังสือรับรองภาษาอังกฤษเพื่อประกอบการขอวีซ่าไปเสนอผลงานวิจัย",
          description: "ขอหนังสือรับรองสถานะภาพการทำงานและอัตราเงินเดือนเป็นภาษาอังกฤษเพื่อยื่นสถานทูต",
          status: "PENDING" as const,
          currentStepIndex: 1,
          totalSteps: 1,
          requesterId: adminUser.id,
          fileAttachmentUrl: null,
          routes: [
            {
              stepIndex: 1,
              title: "เจ้าหน้าที่งานสารบรรณและทรัพยากรบุคคล",
              approverId: staffUser.id,
              status: "PENDING" as const,
              comment: null,
              actionAt: null,
            },
          ],
        },
      ];

      for (const d of sampleDocs) {
        const { routes, ...docData } = d;
        const existing = await prisma.documentRequest.findUnique({
          where: { tenantId_trackingNo: { tenantId: core.tenantId, trackingNo: d.trackingNo } },
        });
        if (!existing) {
          await prisma.documentRequest.create({
            data: {
              ...docData,
              tenantId: core.tenantId,
              routes: {
                create: routes,
              },
            },
          });
        }
      }
      // Seed sample resources & reservations
      const sampleResources = [
        {
          code: "ROOM-301",
          type: "ROOM" as const,
          nameTh: "ห้องประชุมสารภี 1 (Smart Conference Room)",
          nameEn: "Sarapee Conference Room 1",
          capacity: 50,
          locationTh: "ชั้น 3 อาคาร 100 ปี วิศวศึกษา",
          locationEn: "3rd Floor, Centennial Engineering Building",
          facilities: ["Projector 4K Laser", "Dual Interactive Smart Displays", "Wireless Microphone System", "Zoom/Teams Room Kit"],
          imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop",
          isActive: true,
        },
        {
          code: "ROOM-402",
          type: "ROOM" as const,
          nameTh: "ห้องประชุมและสัมมนาบอร์ดบริหาร (Executive Boardroom)",
          nameEn: "Executive Boardroom 402",
          capacity: 24,
          locationTh: "ชั้น 4 อาคารบริหารคณะ",
          locationEn: "4th Floor, Administration Building",
          facilities: ["Leather Seats", "Motorized Microphones", "Cisco Webex System", "Coffee & Tea Bar"],
          imageUrl: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?q=80&w=1200&auto=format&fit=crop",
          isActive: true,
        },
        {
          code: "VAN-01",
          type: "VEHICLE" as const,
          nameTh: "รถตู้โดยสารส่วนกลาง Toyota Commuter (12 ที่นั่ง)",
          nameEn: "Faculty Commuter Passenger Van 01",
          capacity: 12,
          locationTh: "ลานจอดรถส่วนกลางคณะ ช่องจอด V-01",
          locationEn: "Faculty Central Parking Lot, Slot V-01",
          driverName: "นายสมชาย ใจมั่นคง",
          facilities: ["GPS Tracking", "Dashcam", "First-Aid Kit", "Emergency Tools"],
          imageUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1200&auto=format&fit=crop",
          isActive: true,
        },
        {
          code: "EV-SHUTTLE",
          type: "VEHICLE" as const,
          nameTh: "รถพลังงานไฟฟ้า VIP EV Shuttle (รับรองแขกและตรวจราชการ)",
          nameEn: "Faculty Official VIP EV Shuttle",
          capacity: 7,
          locationTh: "จุดชาร์จ EV อาคารนวัตกรรม ช่อง E-02",
          locationEn: "EV Charging Station, Innovation Building, Slot E-02",
          driverName: "นายวิเชียร บริการดี",
          facilities: ["Electric Vehicle", "WiFi Hotspot", "Leather Seats"],
          imageUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1200&auto=format&fit=crop",
          isActive: true,
        },
      ];

      const resourceMap: Record<string, string> = {};
      for (const res of sampleResources) {
        let r = await prisma.resource.findUnique({
          where: { tenantId_code: { tenantId: core.tenantId, code: res.code } },
        });
        if (!r) {
          r = await prisma.resource.create({
            data: {
              ...res,
              tenantId: core.tenantId,
            },
          });
        }
        resourceMap[res.code] = r.id;
      }

      // Seed sample reservations
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const afterTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

      const sampleReservations = [
        {
          resourceId: resourceMap["ROOM-301"],
          userId: staffUser.id,
          purpose: "การประชุมวิพากษ์ร่างหลักสูตรวิศวกรรมปัญญาประดิษฐ์และวิทยาการข้อมูล",
          attendeeCount: 25,
          startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0, 0),
          endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 0, 0),
          status: "CONFIRMED" as const,
          approverId: adminUser.id,
        },
        {
          resourceId: resourceMap["ROOM-301"],
          userId: viewerUser.id,
          purpose: "การอบรมเชิงปฏิบัติการ Generative AI for Modern Engineering",
          attendeeCount: 35,
          startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 13, 30, 0),
          endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 16, 30, 0),
          status: "CONFIRMED" as const,
          approverId: adminUser.id,
        },
        {
          resourceId: resourceMap["VAN-01"],
          userId: adminUser.id,
          purpose: "นำคณาจารย์และนักศึกษาไปศึกษาดูงานโรงงานอุตสาหกรรมระบบอัตโนมัติ EEC",
          attendeeCount: 10,
          startTime: new Date(afterTomorrow.getFullYear(), afterTomorrow.getMonth(), afterTomorrow.getDate(), 8, 0, 0),
          endTime: new Date(afterTomorrow.getFullYear(), afterTomorrow.getMonth(), afterTomorrow.getDate(), 17, 0, 0),
          status: "CONFIRMED" as const,
          approverId: adminUser.id,
        },
        {
          resourceId: resourceMap["ROOM-402"],
          userId: staffUser.id,
          purpose: "ประชุมคณะกรรมการขับเคลื่อนนโยบายความร่วมมือภาคอุตสาหกรรม (วาระเร่งด่วน)",
          attendeeCount: 12,
          startTime: new Date(afterTomorrow.getFullYear(), afterTomorrow.getMonth(), afterTomorrow.getDate(), 10, 0, 0),
          endTime: new Date(afterTomorrow.getFullYear(), afterTomorrow.getMonth(), afterTomorrow.getDate(), 12, 0, 0),
          status: "PENDING" as const,
          approverId: null,
        },
      ];

      for (const resv of sampleReservations) {
        if (!resv.resourceId) continue;
        const exists = await prisma.reservation.findFirst({
          where: {
            tenantId: core.tenantId,
            resourceId: resv.resourceId,
            startTime: resv.startTime,
          },
        });
        if (!exists) {
          await prisma.reservation.create({
            data: {
              ...resv,
              tenantId: core.tenantId,
            },
          });
        }
      }
    }
  }

  console.log(`[seed] เสร็จ — login: admin@app.local / ${DEV_PASSWORD}`);
}

main().finally(() => prisma.$disconnect());
