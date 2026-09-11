import type { Dictionary } from "@/shared/lib/i18n/translate";

export const MESSAGES: Dictionary = {
  // Navigation & General
  "curriculum.nav": { th: "หลักสูตรการศึกษา", en: "Curriculum & Programs" },
  "curriculum.title": { th: "จัดการหลักสูตรและรายวิชา", en: "Curriculum & Courses Management" },
  "curriculum.subtitle": { th: "บริหารจัดการหลักสูตรระดับปริญญาตรี โท เอก และโครงสร้างรายวิชาประจำคณะ", en: "Manage bachelor, master, and doctoral degree programs and course structures" },
  "curriculum.tab.programs": { th: "หลักสูตรการศึกษา", en: "Degree Programs" },
  "curriculum.tab.courses": { th: "รายวิชาทั้งหมด", en: "All Courses" },

  // Degree Levels
  "curriculum.degree.bachelor": { th: "ปริญญาตรี", en: "Bachelor's Degree" },
  "curriculum.degree.master": { th: "ปริญญาโท", en: "Master's Degree" },
  "curriculum.degree.doctoral": { th: "ปริญญาเอก", en: "Doctoral Degree" },
  "curriculum.degree.all": { th: "ทุกระดับการศึกษา", en: "All Degrees" },

  // Program Management
  "curriculum.program.create": { th: "สร้างหลักสูตรใหม่", en: "Create New Program" },
  "curriculum.program.edit": { th: "แก้ไขหลักสูตร", en: "Edit Program" },
  "curriculum.program.delete": { th: "ลบหลักสูตร", en: "Delete Program" },
  "curriculum.program.deleteConfirm": { th: "คุณแน่ใจหรือไม่ว่าต้องการลบหลักสูตรนี้? (ต้องไม่มีรายวิชาผูกอยู่)", en: "Are you sure you want to delete this program? (Must contain no associated courses)" },
  "curriculum.program.code": { th: "รหัสหลักสูตร", en: "Program Code" },
  "curriculum.program.degreeLevel": { th: "ระดับการศึกษา", en: "Degree Level" },
  "curriculum.program.nameTh": { th: "ชื่อหลักสูตร (ไทย)", en: "Program Name (Thai)" },
  "curriculum.program.nameEn": { th: "ชื่อหลักสูตร (อังกฤษ)", en: "Program Name (English)" },
  "curriculum.program.shortNameTh": { th: "ชื่อย่อปริญญา (ไทย)", en: "Degree Abbreviation (Thai)" },
  "curriculum.program.shortNameEn": { th: "ชื่อย่อปริญญา (อังกฤษ)", en: "Degree Abbreviation (English)" },
  "curriculum.program.totalCredits": { th: "จำนวนหน่วยกิตรวม", en: "Total Credits" },
  "curriculum.program.yearIssued": { th: "ปีที่ปรับปรุงหลักสูตร (พ.ศ.)", en: "Curriculum Revision Year" },
  "curriculum.program.tuitionFeeTerm": { th: "ค่าธรรมเนียมการศึกษา/ภาค (บาท)", en: "Tuition Fee / Term (THB)" },
  "curriculum.program.descriptionTh": { th: "รายละเอียดหลักสูตร (ไทย)", en: "Description (Thai)" },
  "curriculum.program.descriptionEn": { th: "รายละเอียดหลักสูตร (อังกฤษ)", en: "Description (English)" },
  "curriculum.program.careerProspects": { th: "แนวทางการประกอบอาชีพ (คั่นด้วยจุลภาค ,)", en: "Career Prospects (comma-separated)" },
  "curriculum.program.leafletPdfUrl": { th: "URL แผ่นพับหลักสูตร (PDF)", en: "Leaflet Brochure URL (PDF)" },
  "curriculum.program.coursesCount": { th: "จำนวนรายวิชา", en: "Courses Count" },
  "curriculum.program.status": { th: "สถานะหลักสูตร", en: "Program Status" },
  "curriculum.program.active": { th: "เปิดสอนอยู่", en: "Active" },
  "curriculum.program.inactive": { th: "ปิดรับสมัคร/ปิดปรับปรุง", en: "Inactive" },
  "curriculum.program.empty": { th: "ไม่พบข้อมูลหลักสูตร", en: "No degree programs found" },
  "curriculum.program.viewCourses": { th: "ดูโครงสร้างรายวิชา", en: "View Courses" },

  // Course Management
  "curriculum.course.create": { th: "เพิ่มรายวิชา", en: "Add Course" },
  "curriculum.course.edit": { th: "แก้ไขรายวิชา", en: "Edit Course" },
  "curriculum.course.delete": { th: "ลบรายวิชา", en: "Delete Course" },
  "curriculum.course.deleteConfirm": { th: "คุณแน่ใจหรือไม่ว่าต้องการลบรายวิชานี้?", en: "Are you sure you want to delete this course?" },
  "curriculum.course.program": { th: "สังกัดหลักสูตร", en: "Belongs to Program" },
  "curriculum.course.code": { th: "รหัสวิชา", en: "Course Code" },
  "curriculum.course.nameTh": { th: "ชื่อวิชา (ไทย)", en: "Course Title (Thai)" },
  "curriculum.course.nameEn": { th: "ชื่อวิชา (อังกฤษ)", en: "Course Title (English)" },
  "curriculum.course.credits": { th: "หน่วยกิต (บรรยาย-ปฏิบัติ-ค้นคว้า)", en: "Credits (e.g. 3(3-0-6))" },
  "curriculum.course.categoryGroup": { th: "หมวดหมู่วิชา", en: "Course Category" },
  "curriculum.course.descriptionTh": { th: "คำอธิบายรายวิชา (ไทย)", en: "Course Description (Thai)" },
  "curriculum.course.descriptionEn": { th: "คำอธิบายรายวิชา (อังกฤษ)", en: "Course Description (English)" },
  "curriculum.course.empty": { th: "ยังไม่มีรายวิชาในหลักสูตรนี้", en: "No courses in this program" },

  // Course Categories
  "curriculum.cat.general": { th: "หมวดวิชาศึกษาทั่วไป", en: "General Education" },
  "curriculum.cat.core": { th: "หมวดวิชาเฉพาะด้าน / พื้นฐานวิชาชีพ", en: "Core / Professional Foundation" },
  "curriculum.cat.major": { th: "หมวดวิชาเอกบังคับ", en: "Major Required" },
  "curriculum.cat.elective": { th: "หมวดวิชาเอกเลือก", en: "Major Elective" },
  "curriculum.cat.free": { th: "หมวดวิชาเลือกเสรี", en: "Free Elective" },
  "curriculum.cat.thesis": { th: "หมวดวิทยานิพนธ์ / โครงงาน", en: "Thesis / Capstone Project" },

  // Form & Actions
  "curriculum.save": { th: "บันทึกข้อมูล", en: "Save" },
  "curriculum.cancel": { th: "ยกเลิก", en: "Cancel" },
  "curriculum.filter.program": { th: "กรองตามหลักสูตร", en: "Filter by Program" },
  "curriculum.filter.allPrograms": { th: "ทุกหลักสูตร", en: "All Programs" },
  "curriculum.search.placeholder": { th: "ค้นหารหัสวิชา, ชื่อวิชา...", en: "Search course code, title..." },

  // Public Portal View
  "curriculum.portal.title": { th: "หลักสูตรระดับปริญญา", en: "Academic Programs" },
  "curriculum.portal.subtitle": { th: "เปิดประตูสู่อนาคตด้วยหลักสูตรที่ทันสมัย มาตรฐานสากล มุ่งเน้นการลงมือปฏิบัติจริงและการวิจัยขั้นสูง", en: "Unlock your future with cutting-edge academic curricula accredited internationally" },
  "curriculum.portal.tuitionPerTerm": { th: "บาท / ภาคการศึกษา", en: "THB / semester" },
  "curriculum.portal.creditsTotal": { th: "หน่วยกิตรวม", en: "Total Credits" },
  "curriculum.portal.curriculumPlan": { th: "แผนการศึกษา พ.ศ.", en: "Curriculum Plan B.E." },
  "curriculum.portal.careerHighlight": { th: "อาชีพที่รองรับเมื่อสำเร็จการศึกษา", en: "Career Opportunities" },
  "curriculum.portal.downloadLeaflet": { th: "ดาวน์โหลดแผ่นพับหลักสูตร", en: "Download Leaflet" },
  "curriculum.portal.structureModalTitle": { th: "โครงสร้างหลักสูตรและรายวิชา", en: "Curriculum & Course Structure" },

  // Permissions & Roles
  "roles.module.curriculum": { th: "ระบบหลักสูตรและรายวิชา", en: "Curriculum & Courses" },
  "perm.curriculum:read": { th: "ดูข้อมูลหลักสูตรและรายวิชา", en: "View curriculum programs and courses" },
  "perm.curriculum:manage": { th: "จัดการหลักสูตรและรายวิชา", en: "Manage curriculum programs and courses" },
  "curriculum.error.duplicateProgramCode": { th: "รหัสหลักสูตรนี้มีอยู่ในระบบแล้ว", en: "This program code already exists" },
  "curriculum.error.duplicateCourseCode": { th: "รหัสวิชานี้มีอยู่ในระบบแล้ว", en: "This course code already exists" },
  "curriculum.error.programNotFound": { th: "ไม่พบข้อมูลหลักสูตรที่ระบุ", en: "Program not found" },
  "curriculum.error.courseNotFound": { th: "ไม่พบข้อมูลรายวิชาที่ระบุ", en: "Course not found" },
  "curriculum.error.hasCourses": { th: "ไม่สามารถลบหลักสูตรได้เนื่องจากยังมีรายวิชาผูกอยู่ กรุณาลบรายวิชาก่อน", en: "Cannot delete program with existing courses. Please remove courses first." },
};
