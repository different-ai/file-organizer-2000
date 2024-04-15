import { UnkeyElements } from "./keys/client";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">Welcome to File Organizer 2000</h1>
        { process.env.ENABLE_USER_MANAGEMENT == 'true' ? ( 
        <div className="flex flex-col items-center justify-center">
          <p className="text-xl mt-4">
            Just paste this inside File Organizer 2000 and you're good to go!
          </p>
          <UnkeyElements />
        </div>
        ) :  (
        <p className="text-xl mt-4">
          Just paste this URL in the plugin settings in Obsidian and you're good to go!
        </p>
        )}
   </div>
    </main>
  );
}
