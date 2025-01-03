import Link from "next/link";
import { Input } from "./input";
import { Button } from "./button";

export function Footer() {
  return (
    <div>
      <footer className="bg-accent2 text-background text-center py-4">
        <p className="text-xs">
          Even though we have no ads on our site, you might encouter few
          redirects on the player so consider using an{" "}
          <Link
            href="https://getadblock.com/en/"
            className="text-[#b0d4ff]"
            target="_blank"
          >
            adblocker
          </Link>{" "}
          for seamless experience.
        </p>
      </footer>
    </div>
  );
}
