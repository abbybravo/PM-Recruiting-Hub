const fs = require("fs");

const opportunities = JSON.parse(
  fs.readFileSync("./data/opportunities.json", "utf8")
);

const pages = {};

function createTableRow(job) {
  const term = job.startTerm || job.seasons || [];

  const formattedTerm = Array.isArray(term)
    ? term.join(", ")
    : term;

  return `| ${job.company} | ${job.role} | ${job.locations.join("; ")} | ${formattedTerm} | ${job.status} | ${job.link} |`;
}


opportunities.forEach((job) => {

  const categories = job.categories || [];
  const seasons = job.seasons || [];

  const destinations = [
    ...categories,
    ...seasons
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

| Company | Role | Location | Recruiting Season | Application Status | Link |
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
