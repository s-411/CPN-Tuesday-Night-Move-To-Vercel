/**
 * Kit.com (ConvertKit) API v4 Client
 *
 * Documentation: https://developers.kit.com/v4
 *
 * This module provides functions to interact with Kit's email marketing platform:
 * - Add subscribers to forms/lists
 * - Tag subscribers
 * - Look up subscribers by email
 */

const KIT_API_BASE_URL = "https://api.kit.com/v4";

interface KitConfig {
  apiKey: string;
  formId?: string;
}

interface KitSubscriber {
  id: string;
  email_address: string;
  first_name?: string;
  state: "active" | "inactive" | "bounced" | "complained" | "unsubscribed";
  created_at: string;
}

interface KitTag {
  id: string;
  name: string;
  created_at: string;
}

interface AddSubscriberParams {
  email: string;
  firstName?: string;
  tags?: string[]; // Tag names to apply
}

interface TagSubscriberParams {
  subscriberId: string;
  tagName: string;
}

/**
 * Get Kit API configuration from environment variables
 */
export function getKitConfig(): KitConfig {
  const apiKey = Deno.env.get("KIT_API_KEY");
  const formId = Deno.env.get("KIT_FORM_ID");

  if (!apiKey) {
    throw new Error("KIT_API_KEY environment variable is not set");
  }

  return {
    apiKey,
    formId,
  };
}

/**
 * Make an authenticated request to Kit API v4
 */
async function kitRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const config = getKitConfig();

  const headers = {
    "Content-Type": "application/json",
    "X-Kit-Api-Key": config.apiKey,
    ...options.headers,
  };

  const url = `${KIT_API_BASE_URL}${endpoint}`;

  console.log(`[Kit API] ${options.method || "GET"} ${url}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[Kit API] Error: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Kit API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  return response;
}

/**
 * Look up a subscriber by email address
 * Returns null if subscriber not found
 */
export async function getSubscriberByEmail(
  email: string
): Promise<KitSubscriber | null> {
  try {
    // Kit v4 uses email_address parameter for lookups
    const response = await kitRequest(`/subscribers?email_address=${encodeURIComponent(email)}`);
    const data = await response.json();

    // Check if we got subscribers back
    if (data.subscribers && data.subscribers.length > 0) {
      return data.subscribers[0];
    }

    return null;
  } catch (error) {
    console.error(`[Kit API] Error looking up subscriber: ${email}`, error);
    return null;
  }
}

/**
 * Add a subscriber to Kit and optionally to a form
 * If subscriber already exists, updates their information
 *
 * @param params - Email, first name, and optional tags
 * @returns Kit subscriber object with ID
 */
export async function addSubscriberToKit(
  params: AddSubscriberParams
): Promise<KitSubscriber> {
  const config = getKitConfig();

  console.log(`[Kit API] Adding subscriber: ${params.email}`);

  // First check if subscriber already exists
  const existingSubscriber = await getSubscriberByEmail(params.email);

  if (existingSubscriber) {
    console.log(`[Kit API] Subscriber already exists: ${existingSubscriber.id}`);

    // Apply tags if provided
    if (params.tags && params.tags.length > 0) {
      for (const tagName of params.tags) {
        await tagSubscriber({
          subscriberId: existingSubscriber.id,
          tagName,
        });
      }
    }

    return existingSubscriber;
  }

  // Create request body
  const body: any = {
    email_address: params.email,
  };

  if (params.firstName) {
    body.first_name = params.firstName;
  }

  // Step 1: Create subscriber first (Kit v4 requires this)
  const createResponse = await kitRequest("/subscribers", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const createData = await createResponse.json();
  const subscriber = createData.subscriber;

  console.log(`[Kit API] Successfully created subscriber: ${subscriber.id}`);

  // Step 2: Add to form if form ID is configured
  if (config.formId) {
    try {
      await kitRequest(`/forms/${config.formId}/subscribers`, {
        method: "POST",
        body: JSON.stringify({ email_address: params.email }),
      });
      console.log(`[Kit API] Successfully added subscriber to form ${config.formId}`);
    } catch (error) {
      console.error(`[Kit API] Failed to add subscriber to form:`, error);
      // Don't fail - subscriber was created successfully
    }
  }

  // Step 3: Apply tags if provided
  if (params.tags && params.tags.length > 0) {
    for (const tagName of params.tags) {
      await tagSubscriber({
        subscriberId: subscriber.id,
        tagName,
      });
    }
  }

  return subscriber;
}

/**
 * Get or create a tag by name
 * Kit v4 requires tag ID for tagging operations
 */
async function getOrCreateTag(tagName: string): Promise<string> {
  // First, try to find existing tag
  try {
    const response = await kitRequest("/tags");
    const data = await response.json();

    if (data.tags) {
      const existingTag = data.tags.find((tag: KitTag) => tag.name === tagName);
      if (existingTag) {
        console.log(`[Kit API] Found existing tag: ${tagName} (ID: ${existingTag.id})`);
        return existingTag.id;
      }
    }
  } catch (error) {
    console.error(`[Kit API] Error fetching tags:`, error);
  }

  // Tag doesn't exist, create it
  console.log(`[Kit API] Creating new tag: ${tagName}`);

  const response = await kitRequest("/tags", {
    method: "POST",
    body: JSON.stringify({ name: tagName }),
  });

  const data = await response.json();
  const tag = data.tag;

  console.log(`[Kit API] Created tag: ${tagName} (ID: ${tag.id})`);
  return tag.id;
}

/**
 * Tag a subscriber in Kit
 * Creates the tag if it doesn't exist
 *
 * @param params - Subscriber ID and tag name
 */
export async function tagSubscriber(
  params: TagSubscriberParams
): Promise<void> {
  const { subscriberId, tagName } = params;

  console.log(`[Kit API] Tagging subscriber ${subscriberId} with "${tagName}"`);

  // Get or create the tag
  const tagId = await getOrCreateTag(tagName);

  // Apply tag to subscriber
  // Kit v4 uses: POST /tags/{tag_id}/subscribers/{subscriber_id} with empty body
  await kitRequest(`/tags/${tagId}/subscribers/${subscriberId}`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  console.log(`[Kit API] Successfully tagged subscriber ${subscriberId} with "${tagName}"`);
}

/**
 * Convenience function: Add subscriber and apply initial tags
 * This is the main function you'll use for signup integration
 */
export async function addSubscriberWithTags(
  email: string,
  tags: string[],
  firstName?: string
): Promise<{ subscriberId: string; email: string }> {
  try {
    const subscriber = await addSubscriberToKit({
      email,
      firstName,
      tags,
    });

    return {
      subscriberId: subscriber.id,
      email: subscriber.email_address,
    };
  } catch (error) {
    console.error(`[Kit API] Error adding subscriber with tags:`, error);
    throw error;
  }
}

/**
 * Tag an existing subscriber by email address
 * Looks up the subscriber first, then applies the tag
 */
export async function tagSubscriberByEmail(
  email: string,
  tagName: string
): Promise<void> {
  try {
    // Look up subscriber
    const subscriber = await getSubscriberByEmail(email);

    if (!subscriber) {
      console.warn(`[Kit API] Subscriber not found for email: ${email}`);
      throw new Error(`Subscriber not found: ${email}`);
    }

    // Apply tag
    await tagSubscriber({
      subscriberId: subscriber.id,
      tagName,
    });
  } catch (error) {
    console.error(`[Kit API] Error tagging subscriber by email:`, error);
    throw error;
  }
}
