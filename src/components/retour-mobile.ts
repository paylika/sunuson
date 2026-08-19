"use client";

import { useEffect, useRef } from "react";

/**
 * Le geste de retour du téléphone ferme la surcouche, pas l'application.
 *
 * Le lecteur plein écran, la feuille de soutien et celle de publication ne
 * sont que des états React : le système, lui, ne connaît que l'historique des
 * pages. Un fan qui ouvrait le lecteur et faisait le geste de retour quittait
 * donc le site entier, musique coupée — alors qu'il voulait simplement
 * replier l'écran, comme le fait la flèche en haut à gauche.
 *
 * On pose une entrée d'historique à l'ouverture, et le retour la consomme.
 * Le geste retrouve le sens qu'il a partout ailleurs : revenir d'un cran,
 * pas sortir.
 *
 * Fermeture par l'interface : on retire nous-mêmes l'entrée posée, sinon elle
 * s'accumule et il faudrait ensuite appuyer trois fois sur retour pour quitter
 * une page qu'on n'a jamais quittée.
 */
export function useRetourFerme(ouvert: boolean, fermer: () => void) {
  const pose = useRef(false);
  // La fermeture change d'identité à chaque rendu du parent : on la garde
  // dans une référence pour que l'écouteur ne se réabonne pas sans cesse.
  const fermerRef = useRef(fermer);
  fermerRef.current = fermer;

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (ouvert && !pose.current) {
      pose.current = true;
      window.history.pushState({ surcouche: true }, "");
      return;
    }

    if (!ouvert && pose.current) {
      pose.current = false;
      // Uniquement si notre entrée est encore celle du dessus : sinon on
      // remonterait dans l'historique du site et on renverrait le fan sur une
      // page qu'il n'a pas demandée.
      if (window.history.state?.surcouche) window.history.back();
    }
  }, [ouvert]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function surRetour() {
      if (!pose.current) return;
      // Marqué AVANT de fermer : la fermeture déclenche l'effet ci-dessus, qui
      // appellerait history.back() une seconde fois et ferait vraiment sortir.
      pose.current = false;
      fermerRef.current();
    }

    window.addEventListener("popstate", surRetour);
    return () => window.removeEventListener("popstate", surRetour);
  }, []);
}
