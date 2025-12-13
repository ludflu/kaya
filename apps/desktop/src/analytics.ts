const GA_MEASUREMENT_ID = 'G-1SDFY0DH0V'; // Replace with your Desktop App Measurement ID
const GA_API_SECRET = '6DU9XInsTL2QzIVXByDzdw'; // Replace with your API Secret

const GA_ENDPOINT = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;

const getClientId = () => {
  let cid = localStorage.getItem('ga_client_id');
  if (!cid) {
    cid = crypto.randomUUID();
    localStorage.setItem('ga_client_id', cid);
  }
  return cid;
};

const isDev = import.meta.env.DEV;

export const analytics = {
  sendEvent: async (eventName: string, params: Record<string, any> = {}) => {
    if (isDev) {
      console.log(`[Analytics] ${eventName}`, params);
      return;
    }

    try {
      await fetch(GA_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          client_id: getClientId(),
          events: [
            {
              name: eventName,
              params: {
                ...params,
                engagement_time_msec: 100,
                session_id: getClientId(),
              },
            },
          ],
        }),
      });
    } catch (error) {
      console.error('Failed to send analytics event', error);
    }
  },

  pageView: (pageTitle: string) => {
    analytics.sendEvent('page_view', {
      page_title: pageTitle,
      page_location: 'app://desktop', // Custom location for desktop app
    });
  },
};
