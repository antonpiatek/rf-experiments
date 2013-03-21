use strict;
use warnings;
package RF::Decoder::X10Sec;

use base 'RF::Decoder::Pulse';
use RF::Utils qw/within_error_margin/;
use RF::Bits;

use constant {
  DEBUG => $ENV{RF_DECODER_X10SEC_DEBUG},
};

sub new {
  shift->SUPER::new(gap => 9000, gap_high => 4440, long => 1680, short => 600,
                    low => 480, length => 41, @_);
}

sub process_bits {
  my ($self, $bits, $cb) = @_;
  my $bytes = $bits->bytes;
  $cb->($bytes);
}

1;
