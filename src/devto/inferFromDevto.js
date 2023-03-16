import endpoints from "../endpoints.json"

const devtoAPIRoot = endpoints["devto"];

const inferFromDevto = async ({devtoHandle} = {}) => {
    const response = await fetch(`${devtoAPIRoot}/users/by_username?url=${devtoHandle}`);

    const data = await response.json();

    if (data.error && data.error === "Not Found") {
        throw new Error("Invalid Dev.to handle inputted");
    } else {
        return data;
    }
}

export default inferFromDevto;