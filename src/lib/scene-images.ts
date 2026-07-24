/** Local Pexels scene assets (free license). Paths are under /public. */

/** Cache-bust when scene assets are swapped in place. */
const v = "v2";

export const sceneImages = {
  landingHero: `/images/scenes/landing-hero.jpg?${v}`,
  monday: `/images/scenes/onboard-monday.jpg?${v}`,
  slip: `/images/scenes/onboard-slip.jpg?${v}`,
  restart: `/images/scenes/onboard-restart.jpg?${v}`,
  together: `/images/scenes/onboard-together.jpg?${v}`,
  support: `/images/scenes/onboard-support.jpg?${v}`,
  focus: `/images/scenes/onboard-focus.jpg?${v}`,
} as const;

/** Map onboarding story steps to a backdrop. */
export function onboardingSceneForStep(step: number): string {
  switch (step) {
    case 0:
      return sceneImages.monday;
    case 1:
      return sceneImages.slip;
    case 2:
      return sceneImages.restart;
    case 3:
      return sceneImages.focus;
    case 4:
      return sceneImages.together;
    case 5:
      return sceneImages.support;
    case 6:
      return sceneImages.together;
    case 7:
      return sceneImages.focus;
    case 8:
      return sceneImages.monday;
    case 9:
      return sceneImages.support;
    default:
      return sceneImages.focus;
  }
}

export const sceneCredits = [
  {
    file: "landing-hero.jpg",
    credit: "Photo via Pexels",
    url: "https://www.pexels.com/photo/women-laughing-at-gym-10039536/",
  },
  {
    file: "onboard-monday.jpg",
    credit: "Photo via Pexels",
    url: "https://www.pexels.com/photo/people-at-the-park-8692270/",
  },
  {
    file: "onboard-slip.jpg",
    credit: "Photo via Pexels",
    url: "https://www.pexels.com/photo/woman-using-her-phone-6029109/",
  },
  {
    file: "onboard-restart.jpg",
    credit: "Photo via Pexels",
    url: "https://www.pexels.com/photo/woman-with-red-top-and-black-shorts-on-purple-yoga-mat-866019/",
  },
  {
    file: "onboard-together.jpg",
    credit: "Photo via Pexels",
    url: "https://www.pexels.com/photo/man-and-woman-doing-high-five-at-the-gym-4944969/",
  },
  {
    file: "onboard-support.jpg",
    credit: "Photo via Pexels",
    url: "https://www.pexels.com/photo/two-people-smiling-at-each-other-at-the-gym-4853685/",
  },
  {
    file: "onboard-focus.jpg",
    credit: "Photo via Pexels",
    url: "https://www.pexels.com/photo/portrait-of-a-woman-drinking-water-4853247/",
  },
] as const;
