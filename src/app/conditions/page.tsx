import type { Metadata } from "next";
import { APP_NAME, COMMISSION_RATE, MIN_PAYOUT } from "@/lib/config";
import { fcfa } from "@/lib/format";
import { DocumentLegal, Section } from "@/components/document-legal";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: `Conditions d'utilisation — ${APP_NAME}`,
};

const PART = Math.round((1 - COMMISSION_RATE) * 100);
const COMMISSION = Math.round(COMMISSION_RATE * 100);

export default function ConditionsPage() {
  return (
    <Shell>
      <DocumentLegal titre="Conditions d'utilisation" maj="19 août 2026">
        <Section titre="Ce qu'est Amplifan">
          <p>
            Amplifan est une plateforme d&apos;écoute gratuite où les fans
            soutiennent directement les artistes par mobile money. Nous ne
            vendons pas la musique et nous ne prenons aucun abonnement.
          </p>
          <p>
            Nous ne sommes ni un label, ni un distributeur, ni un éditeur. Nous
            ne signons rien avec les artistes et ne demandons aucune
            exclusivité.
          </p>
        </Section>

        <Section titre="Ton compte">
          <p>
            Il faut avoir au moins 15 ans. Tu es responsable de ce que ton
            compte publie, et de garder ton mot de passe pour toi.
          </p>
          <p>
            Tu peux supprimer ton compte à tout moment depuis tes réglages.
            Nous pouvons fermer un compte qui ne respecte pas ces conditions,
            après t&apos;avoir prévenu sauf en cas de gravité manifeste.
          </p>
        </Section>

        <Section titre="Ce que tu publies">
          <p>
            En publiant un son, tu déclares en détenir les droits — les tiens
            comme ceux de tes invités, de tes producteurs et de ta pochette.
            Cette déclaration t&apos;engage.
          </p>
          <p>
            Tu restes propriétaire de ta musique. Tu nous autorises seulement à
            l&apos;héberger et à la diffuser sur Amplifan, gratuitement, tant
            qu&apos;elle y est publiée. Tu la retires quand tu veux, et cette
            autorisation s&apos;arrête avec elle.
          </p>
          <p>
            Sont interdits : la musique qui ne t&apos;appartient pas, les
            appels à la haine ou à la violence, et tout contenu illégal au
            Sénégal.
          </p>
        </Section>

        <Section titre="Si quelqu'un publie ton travail">
          <p>
            Écris-nous en indiquant le lien du morceau et ce qui te lie à
            l&apos;œuvre. Nous retirons le contenu le temps de vérifier, et
            nous prévenons celui qui l&apos;a publié — il peut répondre.
          </p>
          <p>
            Un compte qui recommence est fermé définitivement.
          </p>
        </Section>

        <Section titre="Les soutiens et l'argent">
          <p>
            Un soutien est un versement volontaire d&apos;un fan à un artiste.
            Ce n&apos;est ni un achat, ni un abonnement, ni un investissement :
            il ne donne droit à aucune contrepartie garantie, sauf lorsque
            l&apos;artiste réserve explicitement un inédit à ceux qui le
            soutiennent.
          </p>
          <p>
            Nous retenons {COMMISSION} % sur chaque soutien reçu ; {PART} %
            reviennent à l&apos;artiste. Cette part est prélevée uniquement sur
            ce qui est réellement encaissé.
          </p>
          <p>
            L&apos;artiste demande son retrait dès {fcfa(MIN_PAYOUT)}, sur le
            numéro Wave ou Orange Money qu&apos;il a renseigné. Ce numéro
            n&apos;apparaît jamais publiquement.
          </p>
          <p>
            Un soutien envoyé n&apos;est pas remboursable, sauf erreur de notre
            part ou débit sans contrepartie. Les frais éventuels de
            l&apos;opérateur mobile ne dépendent pas de nous.
          </p>
        </Section>

        <Section titre="Les featurings">
          <p>
            Quand un morceau déclare des invités avec des parts, chaque soutien
            reçu est réparti selon ces parts. C&apos;est l&apos;artiste qui les
            déclare, et il en répond : nous n&apos;arbitrons pas les désaccords
            entre artistes sur un partage.
          </p>
        </Section>

        <Section titre="Ce que nous ne garantissons pas">
          <p>
            Le service est fourni tel quel. Nous faisons de notre mieux pour
            qu&apos;il reste disponible, sans pouvoir le garantir — une panne
            d&apos;un opérateur mobile ou d&apos;un hébergeur ne dépend pas de
            nous.
          </p>
          <p>
            Nous ne sommes pas responsables des contenus publiés par les
            artistes ni des messages laissés par les fans.
          </p>
        </Section>

        <Section titre="Changements">
          <p>
            Ces conditions peuvent évoluer. Un changement important te sera
            annoncé dans l&apos;application avant d&apos;entrer en vigueur.
          </p>
        </Section>

        <Section titre="Droit applicable">
          <p>
            Ces conditions sont soumises au droit sénégalais. En cas de
            différend, nous cherchons d&apos;abord une solution amiable.
          </p>
        </Section>

        <Section titre="Nous écrire">
          <p>Pour toute question : contact@{APP_NAME.toLowerCase()}.app</p>
        </Section>
      </DocumentLegal>
    </Shell>
  );
}
