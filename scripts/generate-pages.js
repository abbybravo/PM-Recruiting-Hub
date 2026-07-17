const fs = require("fs");

const csv = fs.readFileSync("./data/opportunities.csv", "utf8");

const lines = csv.trim().split("\n");

const headers = lines[0].split(",");

const opportunities = lines.slice(1).map(line => {
  const values = line.split(",");

  return {
    company: values[0],
    role: values[1],
    categories: values[2].split(";"),
    locations: values[3].split(";"),
    startTerm: values[4],
    status: values[5],
    link: values[6],
    dateAdded: values[7]
  };
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
