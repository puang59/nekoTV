import Link from "next/link";
import { Input } from "./input";
import { Button } from "./button";

interface HeaderProps {
  animeName: string;
  setAnimeName: (name: string) => void;
  handleSearch: () => void;
}

const Header: React.FC<HeaderProps> = ({
  animeName,
  setAnimeName,
  handleSearch,
}) => {
  return (
    <header className="absolute top-4 right-4 left-0 flex justify-between items-center z-10 px-4">
      {/* "nekoTV" link is hidden on small screens */}
      <Link
        href="/"
        className="text-white font-bold text-xl hidden sm:inline-block ml-2"
      >
        neko<span className="text-accent">TV</span>
      </Link>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Input field */}
        <Input
          type="text"
          placeholder="Search Anime"
          value={animeName}
          onChange={(e) => setAnimeName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          className="text-white flex-1 sm:flex-none w-full sm:w-64 border border-accent rounded-lg px-4 py-2 focus:outline-none focus:ring focus:ring-gray-300"
        />
        {/* Search button */}
        <Button
          type="button"
          onClick={handleSearch}
          className="bg-accent text-background px-4 py-2 rounded-lg hover:bg-accent2"
        >
          Search
        </Button>
      </div>
    </header>
  );
};

export default Header;
