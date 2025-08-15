import { LATEST_API_VERSION } from "@shopify/shopify-api";
const getAppInstallationID = async (shop, session) => {
  try {
    const endpoint = `https://${shop}/admin/api/${LATEST_API_VERSION}/graphql.json`;

    // GraphQL query to fetch the current app installation ID
    const query = `
      query {
        currentAppInstallation { 
          id
        }
      }
    `;

    // Perform the fetch request
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": session.accessToken,
      },
      body: JSON.stringify({ query }),
    });

    // Parse the response
    const responseData = await response.json();

    // Return the app installation ID or null if not available
    return responseData?.data?.currentAppInstallation?.id ?? null;
  } catch (error) {
    console.error("Error getting app installation ID:", error);
    return null; // Return null explicitly in case of an error
  }
};

export default getAppInstallationID;