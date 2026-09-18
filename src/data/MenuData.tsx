
interface MenuItem {
    id: number;
    title: string;
    link: string;
    has_dropdown: boolean;
    sub_menus?: {
        link: string;
        title: string;
    }[];
}

const menu_data: MenuItem[] = [
    {
        id: 1,
        title: "Home",
        link: "/",
        has_dropdown: false,
        // sub_menus: [
        //     { link: "/", title: "Home One" },
        //     { link: "/home-two", title: "Home Two" },
        //     { link: "/home-three", title: "Home Three" },
        //     { link: "/home-four", title: "Home Four" },
        //     { link: "/home-five", title: "Home Five" },
        //     { link: "/home-six", title: "Home Six" },
        //     { link: "/home-seven", title: "Home Seven" },
        // ],
    },
    {
        id: 2,
        title: "Search",
        link: "/search",
        has_dropdown: false,
        // sub_menus: [
        //     { link: "/hotel-grid", title: "Hotel Grid" },
        //     { link: "/search", title: "Tour Grid One" },
        //     { link: "/search", title: "Tour Grid Two" },
        //     { link: "/map-listing", title: "Hotel Listing" },
        //     { link: "/tour-details", title: "Tour Details One" },
        //     { link: "/tour-details-2", title: "Tour Details Two" },
        // ],
    },
    // {
    //     id: 3,
    //     title: "Pages",
    //     link: "#",
    //     has_dropdown: true,
    //     sub_menus: [
    //         { link: "/about", title: "About" },
    //         { link: "/team", title: "Team" },
    //         { link: "/team-details", title: "Team Details" },
    //         { link: "/shop", title: "Shop" },
    //         { link: "/shop-details", title: "Shop Details" },
    //         { link: "/cart", title: "Cart" },
    //         { link: "/wishlist", title: "Wishlist" },
    //         { link: "/checkout", title: "Checkout" },
    //         { link: "/pricing", title: "Pricing" },
    //         { link: "/faq", title: "Faq" },
    //         { link: "/login", title: "Log In" },
    //         { link: "/register", title: "Register" },
    //         { link: "/no-found", title: "Error" },
    //     ],
    // },
    {
        id: 4,
        title: "Blogs",
        link: "/blog-grid",
        has_dropdown: false,
        // sub_menus: [
        //     { link: "/blog-grid", title: "Blog Grid" },
        //     { link: "/blog-standard", title: "Blog Standard" },
        //     { link: "/blog-details", title: "Blog Details" },
        // ],
    },
    {
        id: 5,
        has_dropdown: false,
        title: "Pricing",
        link: "/pricing",
    },
    // {
    //     id: 6,
    //     has_dropdown: false,
    //     title: "Contact",
    //     link: "/contact",
    // },
];

export default menu_data;