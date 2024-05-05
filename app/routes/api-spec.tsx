/*
import { ApiReferenceReact } from '@scalar/api-reference-react'
import apiSpec from '~/lib/generated/PublicAPI.json';

export default function ApiSpec() {
  return (
    <>
      <ApiReferenceReact
        configuration={{
          spec: {
            content: apiSpec
          },
          theme: 'purple',  // everything is better when it is purple.
        }}
      />
    </>
  );
}
*/

import { List, ListItem, ListItemText, ListItemIcon, Typography } from '@mui/material';
import {LooksOneOutlined, LooksTwoOutlined} from '@mui/icons-material';

export default function ApiSpec() {
  return (
    <>
      <Typography variant="h2">API Spec Placeholder</Typography>
      <Typography variant="body1">The package to render the spec is gigantic (about 600 pacakges!), and it really is not needed for this toy API. To enable it perform the following steps:</Typography>
      <List>
        <ListItem>
          <ListItemIcon><LooksOneOutlined /></ListItemIcon>
          <ListItemText>
            Install the package with <Typography variant="caption">npm install @scalar/api-reference-react</Typography>
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemIcon><LooksTwoOutlined /></ListItemIcon>
          <ListItemText>
            Uncomment the commented out bits of this route handler and comment out the uncommented bits.
          </ListItemText>
        </ListItem>
      </List>
    </>
  )
}