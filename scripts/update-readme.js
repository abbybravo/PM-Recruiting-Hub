const fs = require("fs");
const path = require("path");

const opportunitiesFolder = "./data/opportunities";
const readmePath = "./README.md";

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
  "<!-- PM_START -->",
  "<!-- PM_END -->",
  createTable(
    opportunities.filter(
      job =>
        job.roleType === "Program Management" &&
        job.employmentType === "Internship"
    )
  )
);


fs.writeFileSync(
  readmePath,
  readme
);


console.log("README updated successfully!");
