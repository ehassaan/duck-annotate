<p align="center">
  <a href="https://ducklake.io/ducklab" rel="noopener">
 <img width=200px src="https://raw.githubusercontent.com/ehassaan/duck-annotate/main/frontend/public/logos/dl_dark.png" alt="Project logo"></a>
</p>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/dynamic/json?label=version&query=version&url=https://raw.githubusercontent.com/ehassaan/duck-annotate/main/frontend/package.json)](https://ehassaan.github.io/duck-annotate)
[![GitHub Issues](https://img.shields.io/github/issues/ehassaan/duck-annotate.svg)](https://github.com/ehassaan/duck-annotate/issues)
[![License](https://img.shields.io/badge/dynamic/json?label=license&query=license&url=https://raw.githubusercontent.com/ehassaan/duck-annotate/main/frontend/package.json)](/LICENSE)

</div>

---

<p align="center"> AI Powered Data Annotation Tool for Motherduck | Powered by Airbyte
    <br> 
</p>

# Duck Annotate (Airbyte - Motherduck Hackathon)

Duck Annotate is a data annotation tool that uses Airbyte to pull data from different sources and then generates column and table metadata for your Motherduck data lake.

1. Scans your git repositories (e.g. comments/docstrings, ORM model files, relevant functions and classes).
2. Scans your existing data dictionaries (postgres column descriptions).
3. Scans Github issues and comments.
4. Generates relevant table and column descriptions for your tables.
5. Human in the loop approach allows data stewards to verify the generated metadata.

# How it Works?
## Data Extraction

Duck Annotate uses headless Airbyte API to provide a user experience tailored to fetch only the relevant data helpful for annotations. This saves manual effort and costs pulling unnecessary data. Airbyte workspace feature is used to seggregate resources of different users.

## Source Code Scanning

In most cases, it is not practical to provide the complete source code to LLMs. Good chunking and relevant context can make a much bigger impact on your final output than using a fancy large expensive LLM.

Most of existing content chunking libraries are designed for text documents. Duck Annotate uses tree-sitter library which is recently getting a lot of attention due to its use in various AI powered code assitant and intellisence tools. Tree-sitter allows Duck Annotate to generate smarter chunks respecting the code blocks (functions/classes/methods).

Currently only the python language is supported by Duck Annotate. But support for other languages can be easily added by using tree-sitter.

## Vector Embeddings and AI

Motherduck `embedding` and `prompt` commands are used to generate embeddings. Motherduck uses Open AI text-embedding-3-small and gpt-4o-mini by default. Cohere API was also tested but using Motherduck LLM features integrate seamlessly with overall solution.

## Human Verification and Collaboration

Duck Annotate stores all the metadata and verification status within Motherduck, so it allows multiple data stewards having access to same Motherduck database to work collaboratively.

## Inspiration

Duck Annotate gets inspiration from shift left approach to data governance. The goal is to enable AI powered data governance and early discovery of the datasets by data analysts and data scientists even before the data itself is replicated. This makes it much easier to prioritize data engineering activities and create replication and quality controls on demand.

# Technical Details
## Tech Stack

- Frontend: VueJs, Vuetify
- Backend: Bunjs + Elyzia
- Database: Postgres
- Data Movement: Airbyte API
- Data Lake: Motherduck


## Code Structure
- ./frontend/ - Frontend code (Vuejs)
- ./backend/ - Backend code (Bun + ElyziaJs)
- ./.github/ - CI/CD pipelines to build and deploy

## API Docs
- Backend (Open API / Swagger)
- Auth (Open API / Swagger)

## Deployment

- Frontend is deployed on Github pages
- Backend is deployed on Azure Websites
- Backend database is Postgres Neon
- Motherduck and Airbyte trial accounts were used for this hackathon.

# Demo

To demonstrate the functionality of Duck Annotate, I have chosen Odoo as a source.

### Dataset
1. 350+ tables related to various modules (HR, CRM, e-commerce etc) and more can be added using add-ons.
2. Demo data available provided by Odoo for a large number of tables.
3. Some tables have metadata as well.
4. Uses postgres <3

### Information Sources

1. Odoo Git repository
2. Odoo existing table metadata
3. Github issues and wikis

## Declaraitons

- Codium IDE was used for VS Code intellisence. (~5% of code).
- I used color pallete and logo from one of my existing projects.

## Contributions

This project is Apache 2.0 licensed. Contributions are most welcome.
