import { Pipe, PipeTransform } from '@angular/core';
import { ISession } from '../shared/interfaces/session.interface';
import { SessionProvider } from '../shared/providers/session/session';

@Pipe({
    name: 'synonymous'
})

export class SynonymousPipe implements PipeTransform {
    constructor() { }

    /**
     * Recibe una palabra por parámetro, luego intenta buscar su sinónimo
     * en el diccionario de la sesión, si no la encuentra o ante cualquier error, retorna la misma palabra entrante 
     * @param word 
     */
    transform(word: string): string {
        try {
            const session: ISession = SessionProvider.state.value;
            return session.dictionary[word] ? session.dictionary[word] : word;
        } catch (e) {
            return word;
        }
    }
}
