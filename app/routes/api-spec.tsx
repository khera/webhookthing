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
