# airbnb-visualization

## Usage

- Download and install the [latest Node.js and npm][1]
- Clone this repository
- Run `npm install` from the root of the repository to install the required packages
- Run `npm run build` to build the code for the first time
- Run `npm run server` to launch the server
- Visit `http://localhost:8000/public` to view the application

## Development Workflow

- In 1st terminal window/tab, run `npm run watch` to start automatic building
- In 2nd terminal window/tab, run `npm run server` to keep the server running
- Make changes to any files, which should automatically build, and reload `/public`
  - If the `npm run watch` stops working due to errors, re-run it or manually
    build with `npm run build`

[1]: https://nodejs.org/en/download/