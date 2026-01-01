/**
 * Simple hash function adapted from https://github.com/darkskyapp/string-hash
 */
export class Hasher {
  static new(): (str: string) => number {
    let result = 5381;

    return (str: string) => {
      for (let i = 0; i < str.length; i++) {
        result = (result * 33) ^ str.charCodeAt(i);
      }

      return result;
    };
  }
}
