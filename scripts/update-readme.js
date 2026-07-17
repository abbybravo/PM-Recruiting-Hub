const fs = require("fs");
const path = require("path");

const opportunitiesFolder = "./data/opportunities";
const readmePath = "./README.md";


// Read all opportunity JSON files
const opportunities = fs
  .readdirSync(opportunitiesFolder)
  .filter(file => file.endsWith(".json"))
  .map(file => {
    const filePath = path.join(opportunitiesFolder, file);

    return JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );
  });


// Create markdown table rows
function createRow(job) {
  return `| ${job.company} | ${job.role} | ${job.locations.join("; ")} | ${job.startTerm || ""} | ${job.status} | ${job.link} |`;
}


// Replace content between markers
function updateSection(readme, startMarker, endMarker, content) {
console.log("Looking for:", startMarker);
  
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.log(`Missing markers: ${startMarker}`);
    return readme;
  }


  return (
    readme.substring(0, startIndex + startMarker.length)
    +
    "\n\n"
    +
    content
    +
    "\n\n"
    +
    readme.substring(endIndex)
  );

}


// Table template
function createTable(jobs) {

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


// Read README
let readme = fs.readFileSync(readmePath, "utf8");


// Product Management
readme = updateSection(
  readme,
  "<!-- PRODUCT_MANAGEMENT_START -->",
  "<!-- PRODUCT_MANAGEMENT_END -->",
  createTable(
    opportunities.filter(
      job => job.roleType === "Product Management"
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


// Write README
fs.writeFileSync(
  readmePath,
  readme
);


console.log("README updated successfully!");
