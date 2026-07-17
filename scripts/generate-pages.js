const csvParser = require("csv-parser");

const opportunities = [];

fs.createReadStream("./data/opportunities.csv")
  .pipe(csvParser())
  .on("data", (row) => {
    opportunities.push({
      company: row.company,
      role: row.role,
      categories: row.categories.split(";"),
      locations: row.locations.split(";"),
      startTerm: row.startTerm,
      status: row.status,
      link: row.link,
      dateAdded: row.dateAdded
    });
  })
  .on("end", () => {
    generatePages();
  });

const pages = {};

function createTableRow(job) {
  const term = job.startTerm || "";

  return `| ${job.company} | ${job.role} | ${job.locations.join("; ")} | ${formattedTerm} | ${job.status} | ${job.link} |`;
}


opportunities.forEach((job) => {

  const categories = job.categories || [];

const destinations = [
  ...categories
];

  destinations.forEach((page) => {

    if (!pages[page]) {
      pages[page] = [];
    }

    pages[page].push(createTableRow(job));

  });

});


Object.keys(pages).forEach((page)=>{

  const filename =
    page
      .toLowerCase()
      .replaceAll(" ", "-")
      .replaceAll("/", "-");

  const content = `# ${page}


| Company | Role | Location | Start Term | Application Status | Link |
|---|---|---|---|---|---|
${pages[page].join("\n")}


---

⬅️ [Back to README](../README.md)
`;

  fs.writeFileSync(
    `./opportunities/${filename}.md`,
    content
  );

  console.log(`Generated ${filename}.md`);

});
