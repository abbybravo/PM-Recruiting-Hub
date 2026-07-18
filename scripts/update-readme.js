const fs = require("fs");
const path = require("path");

const opportunitiesFolder = "./data/opportunities";
const readmePath = "./README.md";
// fall, spring, summer
const fallPath = "./opportunities/fall-2026.md";
const springPath = "./opportunities/spring-2027.md";
const summerPath = "./opportunities/summer-2027.md";

const opportunities = fs
  .readdirSync(opportunitiesFolder)
  .filter(file => file.endsWith(".json"))
  .map(file => {
    return JSON.parse(
      fs.readFileSync(
        path.join(opportunitiesFolder, file),
        "utf8"
      )
    );
  });


function createRow(job) {
  return `| ${job.company} | ${job.role} | ${job.locations.join("; ")} | ${job.startTerm || ""} | ${job.status} | ${job.link} |`;
}

//for closing soon
function createClosingSoonRow(job) {
  const deadline = new Date(job.deadline).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );

  return `| ${job.company} | ${job.role} | ${job.locations.join("; ")} | ${job.startTerm || ""} | ${deadline} | ${job.status} | ${job.link} |`;
}



function createTable(jobs) {

  const latestJobs = jobs
    .sort((a, b) =>
      new Date(b.dateAdded) - new Date(a.dateAdded)
    )
    .slice(0, 5);


  if (latestJobs.length === 0) {
    return "_No opportunities currently listed._";
  }


  return `
| Company | Role | Location | Start Term | Application Status | Link |
|---|---|---|---|---|---|
${latestJobs.map(createRow).join("\n")}
`;
}

//for closing soon
function createClosingSoonTable(jobs) {
  const closingSoonJobs = jobs.slice(0, 5);

  if (closingSoonJobs.length === 0) {
    return "_No opportunities currently closing soon._";
  }

  return `
| Company | Role | Location | Start Term | Deadline | Application Status | Link |
|---|---|---|---|---|---|---|
${closingSoonJobs.map(createClosingSoonRow).join("\n")}
`;
}


function updateSection(readme, startMarker, endMarker, content) {

  const start = readme.indexOf(startMarker);
  const end = readme.indexOf(endMarker);


  if (start === -1 || end === -1) {
    console.log("Missing markers:", startMarker);
    return readme;
  }


  return (
    readme.slice(0, start + startMarker.length)
    +
    "\n"
    +
    content
    +
    "\n"
    +
    readme.slice(end)
  );
}


let readme = fs.readFileSync(readmePath, "utf8");

//for recruiting cycles
function updateFile(filePath, startMarker, endMarker, content) {
  let file = fs.readFileSync(filePath, "utf8");

  file = updateSection(
    file,
    startMarker,
    endMarker,
    content
  );

  fs.writeFileSync(filePath, file);
}

// Recently Added
readme = updateSection(
  readme,
  "<!-- RECENT_OPPORTUNITIES_START -->",
  "<!-- RECENT_OPPORTUNITIES_END -->",
  createTable(
    opportunities
      .sort(
        (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)
      )
      .slice(0, 10)
  )
);

// Closing Soon
const today = new Date();

const oneWeekFromNow = new Date();
oneWeekFromNow.setDate(today.getDate() + 7);

const closingSoonJobs = opportunities
  .filter(job => {
    if (!job.deadline) return false;

    const deadline = new Date(job.deadline);

    return deadline >= today && deadline <= oneWeekFromNow;
  })
  .sort(
    (a, b) => new Date(a.deadline) - new Date(b.deadline)
  );


readme = updateSection(
  readme,
  "<!-- CLOSING_SOON_START -->",
  "<!-- CLOSING_SOON_END -->",
  createClosingSoonTable(closingSoonJobs)
);

//for other opportunities that don't clearly state what type it is/PM-related stuff
readme = updateSection(
  readme,
    "<!-- PRODUCT_ADJACENT_OTHER_START -->",
    "<!-- PRODUCT_ADJACENT_OTHER_END -->",
    createTable(
      opportunities.filter(
        job => job.employmentType === "Product-Adjacent/Other"
      )
    )
  );

// New Grad
readme = updateSection(
  readme,
  "<!-- NEW_GRAD_START -->",
  "<!-- NEW_GRAD_END -->",
  createTable(
    opportunities.filter(
      job => job.employmentType === "New Grad"
    )
  )
);


// Product Management
readme = updateSection(
  readme,
  "<!-- PRODUCT_MANAGEMENT_START -->",
  "<!-- PRODUCT_MANAGEMENT_END -->",
  createTable(
    opportunities.filter(
      job =>
        job.roleType === "Product Management" &&
        job.employmentType === "Internship"
    )
  )
);

// Program Management
readme = updateSection(
  readme,
  "<!-- PROGRAM_MANAGEMENT_START -->",
  "<!-- PROGRAM_MANAGEMENT_END -->",
  createTable(
    opportunities.filter(
      job =>
        job.roleType === "Program Management" &&
        job.employmentType === "Internship"
    )
  )
);

// Fall Recruiting
updateFile(
  fallPath,
  "<!-- FALL_START -->",
  "<!-- FALL_END -->",
  createTable(
    opportunities.filter(
      job => job.startTerm?.toString().includes("Fall")
    )
  )
);


// Spring Recruiting
updateFile(
  springPath,
  "<!-- SPRING_START -->",
  "<!-- SPRING_END -->",
  createTable(
    opportunities.filter(
      job => job.startTerm?.toString().includes("Spring")
    )
  )
);


// Summer Recruiting
updateFile(
  summerPath,
  "<!-- SUMMER_START -->",
  "<!-- SUMMER_END -->",
  createTable(
    opportunities.filter(
      job => job.startTerm?.toString().includes("Summer")
    )
  )
);


console.log(
  "Fall jobs:",
  opportunities.filter(
    job => job.startTerm?.toString().includes("Fall")
  )
);

fs.writeFileSync(
  readmePath,
  readme
);


console.log("README updated successfully!");
