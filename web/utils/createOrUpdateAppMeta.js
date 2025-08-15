import shopify from "../shopify.js";

/**
 * Fetches the existing metafield value.
 * @param {Object} client - Shopify GraphQL client.
 * @param {String} gid - App installation ID.
 * @returns {Object} Parsed metafield value or an empty object.
 */
const fetchMetafield = async (client, gid) => {
    const GET_METAFIELD_QUERY = `
    query AppInstallationMetafield($namespace: String!, $key: String!, $ownerId: ID!) {
      appInstallation(id: $ownerId) {
        badgeData: metafield(namespace: $namespace, key: $key) {
          value
        }
      }
    }
  `;

    const queryVariables = {
        namespace: "badge_data",
        key: "badge_data_key",
        ownerId: gid,
    };

    const queryResponse = await client.request(GET_METAFIELD_QUERY, { variables: queryVariables });
    const value = queryResponse?.data?.appInstallation?.badgeData?.value;

    if (!value) return {};

    try {
        return JSON.parse(value);
    } catch (parseError) {
        console.error("Error parsing existing metafield value. Initializing an empty object.", parseError);
        return {};
    }
};

/**
 * Updates the metafield value with the badge data.
 * @param {Object} metafieldValue - Existing metafield value (object with _id keys).
 * @param {Object} badge - Badge data containing _id and other fields.
 * @param {String} action - Action to perform: 'create', 'update', or 'delete'.
 * @returns {Object} Updated metafield value.
 */
const updateMetafieldValue = (metafieldValue, badge, action) => {
    const { _id, timerName, startDate, startTime, endDate, endTime, promotionDescription, color, timerSize, timerPosition, urgencyNotification, urgencyTriggerThreshold } = badge;

    // Create a copy of the existing metafield value
    const updatedMetafieldValue = { ...metafieldValue };

    if (action === 'delete') {
        // Remove the badge with the matching _id
        delete updatedMetafieldValue[_id];
        return updatedMetafieldValue;
    }

    // Create or update the badge
    const badgeData = {
        timerName,
        startDate,
        startTime,
        endDate,
        endTime,
        promotionDescription,
        color,
        timerSize,
        timerPosition,
        urgencyNotification,
        urgencyTriggerThreshold,
    };

    // Remove any undefined or null fields to keep the data clean
    Object.keys(badgeData).forEach((key) => {
        if (badgeData[key] === undefined || badgeData[key] === null) {
            delete badgeData[key];
        }
    });

    if (action === 'create' || action === 'update') {
        // Set or update the badge data under the _id key
        updatedMetafieldValue[_id] = badgeData;
    }

    return updatedMetafieldValue;
};

/**
 * Saves the updated metafield value back to Shopify.
 * @param {Object} client - Shopify GraphQL client.
 * @param {String} gid - App installation ID.
 * @param {Object} updatedValue - Updated metafield value to save.
 */
const saveMetafield = async (client, gid, updatedValue) => {
    const UPDATE_METAFIELD_MUTATION = `
    mutation CreateAppDataMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafieldsSetInput) {
        metafields {
          id
          namespace
          key
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

    const mutationVariables = {
        metafieldsSetInput: [
            {
                namespace: "badge_data",
                key: "badge_data_key",
                type: "json",
                value: JSON.stringify(updatedValue),
                ownerId: gid,
            },
        ],
    };

    const mutationResponse = await client.request(UPDATE_METAFIELD_MUTATION, { variables: mutationVariables });

    if (mutationResponse.data.metafieldsSet.userErrors.length > 0) {
        throw new Error(
            `Metafield update failed: ${mutationResponse.data.metafieldsSet.userErrors
                .map((error) => error.message)
                .join(", ")}`
        );
    }

    console.log("Metafield updated successfully:", mutationResponse.data.metafieldsSet.metafields);
    return mutationResponse.data.metafieldsSet.metafields;
};

/**
 * Main function to handle badge metafield logic.
 * @param {String} gid - App installation ID.
 * @param {Object} session - Shopify session.
 * @param {Object} badge - Badge data containing _id and other fields.
 * @param {String} action - Action to perform: 'create', 'update', or 'delete'.
 */
export default async (gid, session, badge, action = 'create') => {
    try {
        if (!gid || !session || !badge?._id) {
            throw new Error("Missing required parameters: gid, session, or badge._id");
        }

        const client = new shopify.api.clients.Graphql({ session });

        // Fetch existing metafield value
        const metafieldValue = await fetchMetafield(client, gid);

        // Update the metafield value based on the action
        const updatedValue = updateMetafieldValue(metafieldValue, badge, action);

        // Save the updated metafield back to Shopify
        return await saveMetafield(client, gid, updatedValue);
    } catch (error) {
        console.error("Error handling badge metafield:", error.message);
        throw error;
    }
};