/**
*  handle the `GET /status` API endpoint, returning a simple status JSON object
*/

import package_info from '../../package.json';
import { siteURL } from '../lib/siteURL.server';
import { logger } from "~/lib/logger";

export const loader = async () => {
  const server_time = (new Date).toISOString();
  const version = package_info.version;
  const site_url = siteURL();
  logger.debug(`debug mode is enabled`);

  return Response.json({ version, server_time, site_url });
};
